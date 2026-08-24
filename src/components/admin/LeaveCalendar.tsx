"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }

export default function LeaveCalendar({ doctorId, initialLeaves }: { doctorId: string; initialLeaves: string[] }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [leaves, setLeaves] = useState<string[]>(initialLeaves || []);
  const [submitting, setSubmitting] = useState(false);

  const daysInMonth = new Date(month.getFullYear(), month.getMonth()+1, 0).getDate();

  async function addLeave(date: Date) {
    const iso = date.toISOString();
    const reason = prompt('Optional reason for leave') ?? '';
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/doctors/${doctorId}/leave`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: iso, reason }) });
      const data: unknown = await res.json().catch(() => ({} as unknown));
      if (!res.ok) { const errMsg = (data as unknown as Record<string, unknown>)['error'] as string | undefined; toast.error(errMsg ?? 'Failed to add leave'); setSubmitting(false); return; }

      // success: response contains leaveDay and affectedCount
      const affected = (data as unknown as Record<string, unknown>)['affectedCount'] as number | undefined ?? 0;
      setLeaves((s) => [...s, date.toISOString().split('T')[0]]);
      toast.success(`Leave added. ${affected} appointments affected.`);
    } catch {
      toast.error('Network error');
    } finally { setSubmitting(false); }
  }

  function prev() { setMonth(new Date(month.getFullYear(), month.getMonth()-1, 1)); }
  function next() { setMonth(new Date(month.getFullYear(), month.getMonth()+1, 1)); }

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Manage leave</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Manage leave">
        <div>
          <div className="flex items-center justify-between mb-3">
            <Button onClick={prev} variant="ghost">Prev</Button>
            <div className="font-medium">{month.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
            <Button onClick={next} variant="ghost">Next</Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-sm">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d)=> <div key={d} className="text-center font-medium">{d}</div>)}
            {Array.from({ length: new Date(month.getFullYear(), month.getMonth(), 1).getDay() }).map((_, i) => <div key={`pad-${i}`}></div>)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = new Date(month.getFullYear(), month.getMonth(), i+1);
              const isoKey = day.toISOString().split('T')[0];
              const isLeave = leaves.includes(isoKey);
              return (
                <button key={isoKey} onClick={() => addLeave(day)} disabled={submitting} className={['py-2 rounded', isLeave ? 'bg-rose-100 text-rose-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800'].join(' ')}>
                  {i+1}
                </button>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
}
