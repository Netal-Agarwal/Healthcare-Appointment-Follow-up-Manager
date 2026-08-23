// LLM helper — uses the official groq-sdk client. Keep code robust and non-throwing.

import Groq from "groq-sdk";

type PreVisitResultOk = {
  ok: true;
  data: {
    urgency: "LOW" | "MEDIUM" | "HIGH";
    chiefComplaint: string;
    suggestedQuestions: string[];
    urgencySignals: string[];
    changesSinceLastVisit: string | null;
  };
};

type PreVisitResultErr = { ok: false; error: string };

type PostVisitResultOk = { ok: true; data: string };
type PostVisitResultErr = { ok: false; error: string };

const MODEL = "llama-3.3-70b-versatile";
const TIMEOUT_MS = 15_000;

function safeJsonParse(s: string) {
  try {
    return { ok: true, value: JSON.parse(s) } as const;
  } catch (e) {
    return { ok: false, error: (e as Error).message } as const;
  }
}

function extractMessageContent(message: unknown): string {
  // message may be string or array or object depending on SDK shape; be defensive
  if (!message) return "";
  if (typeof message === "string") return message;
  if (Array.isArray(message)) {
    return message
      .map((p) => {
        if (p == null) return "";
        if (typeof p === "string") return p;
        if (typeof p === "object") {
          const rec = p as Record<string, unknown>;
          return (rec["text"] as string | undefined) ?? (rec["content"] as string | undefined) ?? JSON.stringify(p);
        }
        return String(p);
      })
      .join("");
  }
  if (typeof message === "object") {
    const rec = message as Record<string, unknown>;
    return (rec["text"] as string | undefined) ?? (rec["content"] as string | undefined) ?? JSON.stringify(message);
  }
  return String(message);
}

export async function generatePreVisitSummary(
  symptoms: string,
  priorVisitContext:
    | { chiefComplaint: string; clinicalNotes: string; visitDate: Date }
    | null
): Promise<PreVisitResultOk | PreVisitResultErr> {
  if (!process.env.GROQ_API_KEY) {
    return { ok: false, error: "GROQ_API_KEY is not configured" };
  }

  const lines: string[] = [];
  if (priorVisitContext) {
    const dateStr = new Date(priorVisitContext.visitDate).toISOString().split("T")[0];
    lines.push(
      `Previous visit on ${dateStr}: chief complaint was ${priorVisitContext.chiefComplaint}, doctor's notes were ${priorVisitContext.clinicalNotes}.`
    );
  }
  lines.push(`Current symptoms: ${symptoms}.`);
  lines.push(
    `Analyse the current symptoms and return JSON with: urgency (Low/Medium/High), chiefComplaint, exactly 3 suggestedQuestions for the doctor that account for what's changed since the prior visit, urgencySignals (a short list of 1-3 phrases explaining why this urgency level was chosen), and changesSinceLastVisit (one sentence noting what's new, resolved, or worsened compared to the previous visit — or null if no prior visit).`)
  lines.push("Do not diagnose. Do not recommend treatment. Only organize and flag information for the doctor's review.");

  const prompt = lines.join("\n\n");

  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const resp = await client.chat.completions.create(
      { model: MODEL, messages: [{ role: "user", content: prompt }] },
      { timeout: TIMEOUT_MS }
    );

    const respObj = resp as unknown as Record<string, unknown>;
    const choicesRaw = respObj["choices"] as unknown;
    const choice = Array.isArray(choicesRaw) ? choicesRaw[0] : undefined;
    if (!choice) {
      return { ok: false, error: `LLM returned empty response` };
    }

    const choiceRec = (typeof choice === "object" && choice !== null) ? (choice as Record<string, unknown>) : undefined;
    const msg = choiceRec ? (choiceRec["message"] ?? choiceRec) : choice;
    const msgRec = (typeof msg === "object" && msg !== null) ? (msg as Record<string, unknown>) : undefined;
    const text = extractMessageContent(msgRec ? (msgRec["content"] ?? msgRec["text"] ?? msgRec) : msg);

    const parsed = safeJsonParse(text);
    if (!parsed.ok) {
      return { ok: false, error: `LLM returned invalid JSON: ${parsed.error}` };
    }

    const out = parsed.value;

    // Validate fields
    const urgency = String(out.urgency || "").toUpperCase();
    if (!["LOW", "MEDIUM", "HIGH"].includes(urgency)) {
      return { ok: false, error: `Invalid urgency value: ${out.urgency}` };
    }
    if (typeof out.chiefComplaint !== "string") {
      return { ok: false, error: `chiefComplaint must be a string` };
    }
    if (!Array.isArray(out.suggestedQuestions) || out.suggestedQuestions.length !== 3 || !out.suggestedQuestions.every((s: unknown) => typeof s === "string")) {
      return { ok: false, error: `suggestedQuestions must be an array of exactly 3 strings` };
    }
    if (!Array.isArray(out.urgencySignals) || out.urgencySignals.length < 1 || out.urgencySignals.length > 3 || !out.urgencySignals.every((s: unknown) => typeof s === "string")) {
      return { ok: false, error: `urgencySignals must be an array of 1-3 strings` };
    }
    if (!(typeof out.changesSinceLastVisit === "string" || out.changesSinceLastVisit === null)) {
      return { ok: false, error: `changesSinceLastVisit must be string or null` };
    }

    return {
      ok: true,
      data: {
        urgency: urgency as "LOW" | "MEDIUM" | "HIGH",
        chiefComplaint: out.chiefComplaint,
        suggestedQuestions: out.suggestedQuestions,
        urgencySignals: out.urgencySignals,
        changesSinceLastVisit: out.changesSinceLastVisit,
      },
    };
  } catch (e) {
    const err = e as Error;
    return { ok: false, error: `LLM error: ${err.message}` };
  }
}

export async function generatePostVisitSummary(notes: string): Promise<PostVisitResultOk | PostVisitResultErr> {
  if (!process.env.GROQ_API_KEY) {
    return { ok: false, error: "GROQ_API_KEY is not configured" };
  }

  const prompt = `Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: ${notes}. Only summarize what is explicitly present in the notes — do not add, remove, or infer medication details.`;

  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const resp = await client.chat.completions.create(
      { model: MODEL, messages: [{ role: "user", content: prompt }] },
      { timeout: TIMEOUT_MS }
    );

    const respObj = resp as unknown as Record<string, unknown>;
    const choicesRaw = respObj["choices"] as unknown;
    const choice = Array.isArray(choicesRaw) ? choicesRaw[0] : undefined;
    if (!choice) {
      return { ok: false, error: `LLM returned empty response` };
    }

    const choiceRec = (typeof choice === "object" && choice !== null) ? (choice as Record<string, unknown>) : undefined;
    const msg = choiceRec ? (choiceRec["message"] ?? choiceRec) : choice;
    const msgRec = (typeof msg === "object" && msg !== null) ? (msg as Record<string, unknown>) : undefined;
    const text = extractMessageContent(msgRec ? (msgRec["content"] ?? msgRec["text"] ?? msgRec) : msg);

    return { ok: true, data: text };
  } catch (e) {
    const err = e as Error;
    return { ok: false, error: `LLM error: ${err.message}` };
  }
}
