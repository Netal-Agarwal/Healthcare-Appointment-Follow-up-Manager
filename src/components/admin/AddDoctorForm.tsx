"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";

type Wh = { dayOfWeek: number; startTime: string; endTime: string; enabled?: boolean };

export default function AddDoctorForm({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialisation, setSpecialisation] = useState("");
  const [slotDuration, setSlotDuration] = useState<number>(30);

  const [working, setWorking] = useState<Wh[]>(Array.from({ length: 7 }).map((_, i) => ({ dayOfWeek: i, startTime: "09:00", endTime: "17:00", enabled: false })));
  const [loading, setLoading] = useState(false);

  function toggleDay(idx: number) {
    setWorking((w) => w.map((row, i) => i === idx ? { ...row, enabled: !row.enabled } : row));
  }

  function updateTime(idx: number, field: 'startTime'|'endTime', value: string) {
    setWorking((w) => w.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  }

  async function submit() {
    // validation
    if (!name.trim() || !email.trim() || !password.trim() || !specialisation.trim()) {
      toast.error("Please complete all required fields");
      return;
    }

    const wh = working.filter((r) => r.enabled).map((r) => ({ dayOfWeek: r.dayOfWeek, startTime: r.startTime, endTime: r.endTime }));
    if (wh.length === 0) {
      toast.error("Please enable at least one working day");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/doctors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, specialisation, slotDurationMinutes: slotDuration, workingHours: wh }) });
      const data: unknown = await res.json().catch(() => ({} as unknown));
      if (!res.ok) {
        const errMsg = (data as unknown as Record<string, unknown>)['error'] as string | undefined;
        toast.error(errMsg ?? 'Failed to create doctor');
        setLoading(false);
        return;
      }

      toast.success('Doctor created');
      setOpen(false);
      setStep(1);
      // reset fields
      setName(''); setEmail(''); setPassword(''); setSpecialisation(''); setSlotDuration(30);
      setWorking(Array.from({ length: 7 }).map((_, i) => ({ dayOfWeek: i, startTime: '09:00', endTime: '17:00', enabled: false })));
      onCreated?.();
    } catch {
      toast.error('Network error');
    } finally { setLoading(false); }
  }

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Add Doctor</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add doctor">
        <div>
          {step === 1 && (
            <div className="space-y-3">
              <label className="block"><div className="text-sm font-medium">Name</div><Input value={name} onChange={(e) => setName(e.target.value)} /></label>
              <label className="block"><div className="text-sm font-medium">Email</div><Input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
              <label className="block"><div className="text-sm font-medium">Password</div><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
              <div className="flex justify-end gap-2"><Button onClick={() => setStep(2)}>Next</Button></div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <label className="block"><div className="text-sm font-medium">Specialisation</div><Input value={specialisation} onChange={(e) => setSpecialisation(e.target.value)} /></label>
              <label className="block"><div className="text-sm font-medium">Slot duration (minutes)</div><Input type="number" value={slotDuration} onChange={(e) => setSlotDuration(Number(e.target.value) || 30)} /></label>
              <div className="flex justify-between">
                <Button onClick={() => setStep(1)} variant="ghost">Back</Button>
                <Button onClick={() => setStep(3)}>Next</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Working hours</div>
              <div className="grid grid-cols-1 gap-2">
                {working.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={!!r.enabled} onChange={() => toggleDay(i)} /> <span className="w-24">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i]}</span></label>
                    <Input type="time" value={r.startTime} onChange={(e) => updateTime(i, 'startTime', e.target.value)} />
                    <Input type="time" value={r.endTime} onChange={(e) => updateTime(i, 'endTime', e.target.value)} />
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <Button onClick={() => setStep(2)} variant="ghost">Back</Button>
                <Button onClick={submit} disabled={loading}>{loading ? 'Creating...' : 'Create doctor'}</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
