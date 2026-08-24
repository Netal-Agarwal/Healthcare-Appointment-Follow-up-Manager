import React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Card from "@/components/ui/Card";
import AddDoctorForm from "@/components/admin/AddDoctorForm";

export default async function AdminDoctorsPage() {
  const session = await auth();
  if (!session || !session.user?.id) return (<div className="p-4">Unauthorized</div>);
  if (session.user.role !== "ADMIN") return (<div className="p-4">Forbidden</div>);

  const doctors = await prisma.user.findMany({ where: { role: 'DOCTOR' }, include: { doctorProfile: { include: { workingHours: true } } }, orderBy: { name: 'asc' } });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Doctors</h1>
        <AddDoctorForm onCreated={() => { /* client can refresh via navigation or SWR if implemented later */ }} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {doctors.map((d) => (
          <Card key={d.id}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{d.name}</div>
                <div className="text-sm text-slate-500">{d.email}</div>
                <div className="text-sm text-slate-500">{d.doctorProfile?.specialisation ?? ''}</div>
              </div>
              <div className="text-sm text-slate-500">{d.doctorProfile ? `${d.doctorProfile.workingHours.length} working days` : ''}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
