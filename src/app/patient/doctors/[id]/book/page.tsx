"use client";
import React, { useEffect, useMemo, useState } from "react";
// no useRouter needed here
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
// Badge not required in this file
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

type Slot = { id: string; startTime: string; endTime: string; status: string; heldUntil?: string | null };

function formatTime(dtStr: string) {
  const d = new Date(dtStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function BookPage({ params }: { params: { id: string } }) {
  const doctorId = params.id;
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState<{ id: string } | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/doctors/${doctorId}/slots`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => toast.error("Failed to load slots"))
      .finally(() => setLoading(false));
  }, [doctorId]);

  // compute grouped by day
  const grouped = useMemo(() => {
    if (!slots) return {} as Record<string, Slot[]>;
    const map: Record<string, Slot[]> = {};
    for (const s of slots) {
      const day = new Date(s.startTime).toDateString();
      (map[day] ||= []).push(s);
    }
    return map;
  }, [slots]);

  useEffect(() => {
    let t: number | null = null;
    if (holdExpiresAt) {
      const update = () => {
        const diff = Math.max(0, Math.floor((holdExpiresAt.getTime() - Date.now()) / 1000));
        setTimeLeft(diff);
        if (diff <= 0 && t) {
          clearInterval(t);
        }
      };
      update();
      t = window.setInterval(update, 1000);
    }
    return () => { if (t) clearInterval(t); };
  }, [holdExpiresAt]);

  async function selectSlot(slot: Slot) {
    // mark selection in-flight (no local selected state)
    try {
      const res = await fetch(`/api/appointments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slotId: slot.id }) });
      if (res.status === 409) {
        toast.error("That slot was just taken — refreshing available times.");
        // refresh slots
        const fresh = await fetch(`/api/doctors/${doctorId}/slots`, { cache: "no-store" }).then((r) => r.json());
        setSlots(fresh.slots ?? []);
        return;
      }

      if (!res.ok) {
        toast.error("Failed to hold slot. Please try again.");
        return;
      }

      const data: unknown = await res.json();
      if (typeof data === "object" && data !== null) {
        const shaped = data as { appointment?: { id?: string }; slot?: { heldUntil?: string | null } };
        const appt = shaped.appointment;
        const slotInfo = shaped.slot;
        if (appt && typeof appt.id === "string") setAppointment({ id: appt.id });
        if (slotInfo?.heldUntil) setHoldExpiresAt(new Date(slotInfo.heldUntil));
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  }

  if (loading || !slots) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Book</h1>
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (appointment) {
    // show symptom form step
    return <SymptomStep appointment={appointment} timeLeft={timeLeft} expired={timeLeft === 0} />;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Select a time</h1>

      <div className="space-y-4">
        {Object.entries(grouped).map(([day, items]) => (
          <Card key={day}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{day}</div>
                <div className="text-sm text-slate-500">{items.length} slots</div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {items.map((s) => (
                <button key={s.id} onClick={() => selectSlot(s)} className="rounded-md border px-2 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                  {formatTime(s.startTime)}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SymptomStep({ appointment, timeLeft, expired }: { appointment: { id: string }; timeLeft: number | null; expired: boolean }) {
  const [symptoms, setSymptoms] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (expired) {
      toast.error("Your hold has expired. Please reselect a slot.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symptoms }) });
      const data = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok) {
        const errMsg = (data as Record<string, unknown>)['error'] as string | undefined;
        toast.error(errMsg || "Failed to confirm appointment");
        setSubmitting(false);
        return;
      }
      // If LLM pre-visit summary was not available, show a friendly note.
      try {
        const preVisit = (data as Record<string, unknown>)['preVisit'] as { ok?: boolean } | undefined;
        if (preVisit && preVisit.ok === false) {
          toast('We couldn\'t generate an automatic pre-visit summary, but your appointment is confirmed.');
        } else {
          toast.success("Appointment confirmed");
        }
      } catch {
        toast.success("Appointment confirmed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card>
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5" />
          <div>
            <div className="text-sm">Complete within</div>
            <div className="text-lg font-medium">{timeLeft !== null ? new Date(timeLeft * 1000).toISOString().substr(14, 5) : "10:00"}</div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-4">
          <label className="block">
            <div className="text-sm font-medium">Symptoms</div>
            <textarea className="w-full rounded-md border px-3 py-2 mt-2" rows={6} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Describe what you're experiencing, when it started, and how severe it feels." />
          </label>

          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Confirm appointment"}</Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}
