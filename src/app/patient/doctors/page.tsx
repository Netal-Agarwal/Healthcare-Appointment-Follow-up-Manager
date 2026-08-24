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
    <div className="hf-section">
      <div>
        <h1 className="hf-page-title">Find a doctor</h1>
        <p className="hf-page-subtitle">Choose a specialist, check live availability, and begin a secure booking.</p>
      </div>

      <div className="rounded-2xl border bg-[#eff4ff] p-4">
        <div className="flex gap-2 flex-wrap">
          {[[null,"All"],["cardiology","Cardiology"],["dermatology","Dermatology"],["general","General"]].map(([value,label]) => <button key={label} onClick={() => setFilter(value)} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === value ? "bg-[#006398] text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-[#e5eeff]"}`}>{label}</button>)}
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
    <Card className="transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold text-[#091426]">{doctor.user.name ?? "Dr. Staff"}</div>
          <div className="mt-1 text-sm text-slate-600">{doctor.specialisation ?? "General"} · {doctor.slotDurationMinutes ?? 30} min visits</div>
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
