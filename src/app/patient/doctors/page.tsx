"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";

type Doctor = { id: string; user: { id: string; name?: string | null }; specialisation?: string; slotDurationMinutes?: number };

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/doctors${filter ? `?specialisation=${encodeURIComponent(filter)}` : ""}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.doctors) setDoctors(data.doctors);
        else {
          toast.error("Failed to load doctors.");
          setDoctors([]);
        }
      })
      .catch(() => {
        toast.error("Failed to load doctors.");
        setDoctors([]);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Find a doctor</h1>
      </div>

      <div className="mb-4">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter(null)} className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">All</button>
          <button onClick={() => setFilter("cardiology")} className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">Cardiology</button>
          <button onClick={() => setFilter("dermatology")} className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">Dermatology</button>
          <button onClick={() => setFilter("general")} className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">General</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        )}

        {!loading && doctors && doctors.length === 0 && <div className="text-sm text-slate-500">No doctors found.</div>}

        {!loading && doctors && doctors.map((d) => (
          <DoctorCard key={d.id} doctor={d} />
        ))}
      </div>
    </div>
  );
}

function DoctorCard({ doctor }: { doctor: Doctor }) {
  const [slotsCount, setSlotsCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/doctors/${doctor.id}/slots`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.slots) setSlotsCount(data.slots.length);
        else setSlotsCount(0);
      })
      .catch(() => setSlotsCount(0));
    return () => { cancelled = true; };
  }, [doctor.id]);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-medium">{doctor.user.name ?? "Dr. Staff"}</div>
          <div className="text-sm text-slate-500">{doctor.specialisation ?? "General"}</div>
        </div>
        <div className="text-right">
          {slotsCount === null ? <div className="text-sm text-slate-400">Checking...</div> : <Badge variant={slotsCount > 5 ? "low" : slotsCount > 0 ? "medium" : "high"}>{slotsCount} available</Badge>}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <a href={`/patient/doctors/${doctor.id}/book`}>
          <Button>Book</Button>
        </a>
      </div>
    </Card>
  );
}
