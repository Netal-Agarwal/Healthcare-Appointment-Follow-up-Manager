import React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Card from "@/components/ui/Card";

export default async function DoctorSchedulePage() {
  const session = await auth();
  if (!session || !session.user?.id) return <div className="p-4">Unauthorized</div>;
  if (session.user.role !== "DOCTOR") return <div className="p-4">Forbidden</div>;

  const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: session.user.id } });
  if (!doctorProfile) return <div className="p-4">Doctor profile not found</div>;

  const working = await prisma.workingHour.findMany({ where: { doctorProfileId: doctorProfile.id }, orderBy: { dayOfWeek: 'asc' } });
  const leave = await prisma.leaveDay.findMany({ where: { doctorProfileId: doctorProfile.id }, orderBy: { date: 'asc' } });

  const upcoming = await prisma.appointment.findMany({ where: { doctorProfileId: doctorProfile.id, slot: { startTime: { gt: new Date() } } }, include: { slot: true }, orderBy: { slot: { startTime: 'asc' } }, take: 20 });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Schedule</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <div className="text-sm font-medium">Working hours</div>
          <div className="mt-3 space-y-2 text-sm">
            {working.map((w) => (
              <div key={w.id}>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][w.dayOfWeek]} {w.startTime} — {w.endTime}</div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="text-sm font-medium">Upcoming leave days</div>
          <div className="mt-3 text-sm space-y-2">
            {leave.length ? leave.map((l) => <div key={l.id}>{new Date(l.date).toLocaleDateString()} {l.reason ? `— ${l.reason}` : ''}</div>) : <div className="text-slate-500">No upcoming leave</div>}
          </div>
        </Card>

        <Card>
          <div className="text-sm font-medium">Upcoming appointments</div>
          <div className="mt-3 text-sm space-y-2">
            {upcoming.length ? upcoming.map((a) => <div key={a.id}>{a.slot?.startTime.toLocaleString()}</div>) : <div className="text-slate-500">No upcoming appointments</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
