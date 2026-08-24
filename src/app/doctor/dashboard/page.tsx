import React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Card from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function DoctorDashboardPage() {
  const session = await auth();
  if (!session || !session.user?.id) return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Appointments — Today</h1>
      <Card>
        <p className="text-sm text-slate-500">You must be signed in as a doctor to view this page.</p>
      </Card>
    </div>
  );

  if (session.user.role !== "DOCTOR") return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Appointments — Today</h1>
      <Card>
        <p className="text-sm text-slate-500">This area is for doctors only.</p>
      </Card>
    </div>
  );

  // find doctor profile
  const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: session.user.id } });
  if (!doctorProfile) return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Appointments — Today</h1>
      <Card>
        <p className="text-sm text-slate-500">Doctor profile not found.</p>
      </Card>
    </div>
  );

  const start = new Date();
  start.setHours(0,0,0,0);
  const end = new Date();
  end.setHours(23,59,59,999);

  const appts = await prisma.appointment.findMany({
    where: { doctorProfileId: doctorProfile.id, AND: [{ slot: { startTime: { gte: start } } }, { slot: { startTime: { lte: end } } }] },
    include: { slot: true, patient: true, symptomForm: true },
    orderBy: { slot: { startTime: "asc" } },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Appointments — Today</h1>

      {appts.length === 0 && (
        <Card>
          <div className="flex flex-col items-center py-8">
            <div className="text-lg font-medium mb-2">No appointments today</div>
            <p className="text-sm text-slate-500">You have no scheduled visits for today.</p>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {appts.map((a) => {
          const slot = a.slot;
          const patientName = a.patient?.name ?? "Patient";
          const urgency = a.symptomForm?.urgency ?? null;
          const timeStr = slot.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          const badgeVariant = urgency ? (urgency === 'HIGH' ? 'high' : urgency === 'MEDIUM' ? 'medium' : 'low') as 'low' | 'medium' | 'high' : undefined;

          return (
            <Card key={a.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">{timeStr}</div>
                  <div className="font-medium">{patientName}</div>
                  <div className="text-sm text-slate-500">{a.status}</div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={badgeVariant}>{urgency ? urgency : a.status}</Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
