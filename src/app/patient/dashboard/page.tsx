"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";

type Appointment = { id: string; status: string; slot: { startTime: string; endTime: string } | null; doctor?: { id: string; name?: string | null; specialisation?: string } | null; visitNote?: { patientSummary?: string | null; medicationReminders?: { scheduledAt: string }[] } | null };

export default function PatientDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/appointments', { cache: 'no-store' }).then((r) => r.json()).catch((e) => { throw e }),
      fetch('/api/auth/google/status', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ connected: false })),
    ])
      .then(([apptsRaw, gRaw]) => {
        if (apptsRaw?.error) {
          if (apptsRaw?.status === 401) {
            window.location.href = '/auth/login';
            return;
          }
          toast.error('Failed to load appointments');
          setAppointments([]);
        } else {
          setAppointments(apptsRaw.appointments ?? []);
        }

        setConnected(!!gRaw?.connected);
      })
      .catch(() => { toast.error('Network error'); setAppointments([]); setConnected(false); })
      .finally(() => setLoading(false));
  }, []);

  // Render
  // NOTE: There is no backend GET endpoint to list patient appointments.
  // Per instructions we do not invent endpoints. Show a helpful empty state.

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Your dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-medium">Upcoming appointments</h2>
          <div className="mt-4">
            {loading && <Skeleton className="h-40" />}
            {!loading && appointments && appointments.length === 0 && (
              <div className="text-sm text-slate-500">You have no upcoming appointments. Find a doctor to book one.</div>
            )}
            {!loading && appointments && appointments.length > 0 && (
              <div className="space-y-3">
                {appointments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{a.doctor?.name ?? 'Doctor'}</div>
                      <div className="text-sm text-slate-500">{a.doctor?.specialisation}</div>
                    </div>
                    <div className="text-sm text-slate-500">{a.slot ? new Date(a.slot.startTime).toLocaleString() : ''}</div>
                    <div className="ml-4"><span className="text-sm">{a.status}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4">
            <Link href="/patient/doctors">
              <Button>Find a doctor</Button>
            </Link>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-medium">Google Calendar</h2>
          <p className="mt-2 text-sm text-slate-500">Connecting your Google Calendar lets us add confirmed appointments to your primary calendar.</p>
          <div className="mt-2">
            {connected === null ? <div className="text-sm text-slate-500">Checking connection...</div> : connected ? <div className="text-sm text-slate-500">Connected</div> : <div className="text-sm text-slate-500">Not connected</div>}
          </div>
          <div className="mt-4 flex gap-2">
            {!connected && (
              <a href="/api/auth/google">
                <Button variant="secondary">Connect Google Calendar</Button>
              </a>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
