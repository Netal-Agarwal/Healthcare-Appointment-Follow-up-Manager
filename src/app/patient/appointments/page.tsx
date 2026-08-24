"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";

type Appointment = { id: string; status: string; slot: { startTime: string; endTime: string } | null; doctor?: { id: string; name?: string | null; specialisation?: string } | null; visitNote?: { patientSummary?: string | null; medicationReminders?: { scheduledAt: string }[] } | null };

export default function PatientAppointmentsPage() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/appointments', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data?.error) {
          if (((data as unknown) as { status?: number })?.status === 401) {
            window.location.href = '/auth/login';
            return;
          }
          toast.error('Failed to load appointments');
          setAppointments([]);
        } else {
          setAppointments(data.appointments ?? []);
        }
      })
      .catch(() => { toast.error('Network error'); setAppointments([]); })
      .finally(() => setLoading(false));
  }, []);

  async function onCancel(id: string) {
    if (!confirm('Cancel this appointment?')) return;
    try {
      const res = await fetch(`/api/appointments/${id}/cancel`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((((data as unknown) as { error?: string })?.error) || 'Failed to cancel');
        return;
      }
      toast.success('Appointment cancelled');
      // refresh
      setLoading(true);
      const refreshed = await fetch('/api/appointments', { cache: 'no-store' }).then((r) => r.json());
      setAppointments(refreshed.appointments ?? []);
    } catch {
      toast.error('Network error');
    } finally { setLoading(false); }
  }

  // Render
  // There is no backend GET endpoint to list appointments for a patient.
  // Per instructions, we must not invent or mock such endpoint. Inform the user.

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Your appointments</h1>
      <div>
        {loading && <Skeleton className="h-40" />}
        {!loading && appointments && appointments.length === 0 && (
          <Card>
            <p className="text-sm text-slate-500">No appointments found. Book a visit to get started.</p>
            <div className="mt-4">
              <a href="/patient/doctors"><Button>Find a doctor</Button></a>
            </div>
          </Card>
        )}

        {!loading && appointments && appointments.length > 0 && (
          <div className="space-y-3">
            {appointments.map((a) => (
              <Card key={a.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{a.doctor?.name ?? 'Doctor'}</div>
                    <div className="text-sm text-slate-500">{a.doctor?.specialisation}</div>
                  </div>
                  <div className="text-sm text-slate-500">{a.slot ? new Date(a.slot.startTime).toLocaleString() : ''}</div>
                  <div className="ml-4"><span className="text-sm">{a.status}</span></div>
                  <div className="ml-4"><Button onClick={() => onCancel(a.id)} variant="ghost">Cancel</Button></div>
                </div>
                {a.visitNote?.patientSummary && (
                  <div className="mt-3 text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded">{a.visitNote.patientSummary}</div>
                )}
                {a.visitNote?.medicationReminders && a.visitNote.medicationReminders.length > 0 && (
                  <div className="mt-3 text-sm">
                    <div className="font-medium">Medication reminders</div>
                    <ul className="list-disc pl-5">
                      {a.visitNote.medicationReminders.map((m, i) => <li key={i}>{new Date(m.scheduledAt).toLocaleString()} — { /* no med name available in this shape */ 'Medication reminder' }</li>)}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
