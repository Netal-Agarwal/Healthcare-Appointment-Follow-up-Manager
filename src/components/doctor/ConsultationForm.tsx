"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";

type PrescriptionItem = { medication: string; dosage: string; frequencyPerDay: number; durationDays: number };

export default function ConsultationForm({ appointmentId }: { appointmentId: string }) {
  const [open, setOpen] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [prescription, setPrescription] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultSummary, setResultSummary] = useState<string | null>(null);

  function addRow() {
    setPrescription((s) => [...s, { medication: "", dosage: "", frequencyPerDay: 1, durationDays: 1 }]);
  }

  function removeRow(idx: number) {
    setPrescription((s) => s.filter((_, i) => i !== idx));
  }

  function updateRow(idx: number, field: keyof PrescriptionItem, value: string | number) {
    setPrescription((s) =>
      s.map((r, i) => {
        if (i !== idx) return r;
        if (field === "frequencyPerDay" || field === "durationDays") {
          return { ...r, [field]: Number(value) } as PrescriptionItem;
        }
        return { ...r, [field]: String(value) } as PrescriptionItem;
      })
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clinicalNotes.trim()) {
      toast.error("Please add clinical notes");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/visit-note`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clinicalNotes, prescription }) });
      const data: unknown = await res.json().catch(() => ({} as unknown));
      if (!res.ok) {
        const errMsg = (data as unknown as Record<string, unknown>)['error'] as string | undefined;
        toast.error(errMsg ?? "Failed to save visit note");
        setLoading(false);
        return;
      }

      // success
      const visitNote = (data as unknown as { visitNote?: { patientSummary?: string } }).visitNote;
      setResultSummary(visitNote?.patientSummary ?? null);
      toast.success("Visit note saved");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Start Consultation</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Start Consultation">
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <div className="text-sm font-medium">Clinical notes</div>
            <textarea value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} className="w-full rounded-md border px-3 py-2 mt-2" rows={6} />
          </label>

          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Prescription</div>
              <div>
                <Button type="button" onClick={addRow} variant="secondary">Add medication</Button>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {prescription.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <Input aria-label={`medication-${i}`} placeholder="Medication" value={p.medication} onChange={(e) => updateRow(i, 'medication', e.target.value)} />
                  </div>
                  <div className="col-span-3">
                    <Input aria-label={`dosage-${i}`} placeholder="Dosage" value={p.dosage} onChange={(e) => updateRow(i, 'dosage', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" aria-label={`freq-${i}`} min={1} max={24} value={p.frequencyPerDay} onChange={(e) => updateRow(i, 'frequencyPerDay', Number(e.target.value) || 1)} />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" aria-label={`dur-${i}`} min={1} value={p.durationDays} onChange={(e) => updateRow(i, 'durationDays', Number(e.target.value) || 1)} />
                  </div>
                  <div className="col-span-1">
                    <Button type="button" onClick={() => removeRow(i)} variant="ghost">Remove</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save & Finish'}</Button>
          </div>
        </form>

        {resultSummary && (
          <div className="mt-4">
            <h4 className="font-medium">Patient summary (will be sent to patient)</h4>
            <div className="mt-2 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{resultSummary}</div>
          </div>
        )}
      </Modal>
    </div>
  );
}
