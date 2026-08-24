import React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Card from "@/components/ui/Card";
import LeaveCalendar from "@/components/admin/LeaveCalendar";

export default async function DoctorLeavePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !session.user?.id) return (<div className="p-4">Unauthorized</div>);
  if (session.user.role !== "ADMIN") return (<div className="p-4">Forbidden</div>);

  const user = await prisma.user.findUnique({ where: { id: params.id }, include: { doctorProfile: { include: { leaveDays: true } } } });
  if (!user || !user.doctorProfile) return (<div className="p-4">Doctor not found</div>);

  const leaves = user.doctorProfile.leaveDays.map((leave: { date: Date }) => leave.date.toISOString().split('T')[0]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Manage leave — {user.name}</h1>
      <Card>
        <LeaveCalendar doctorId={user.id} initialLeaves={leaves} />
      </Card>
    </div>
  );
}
