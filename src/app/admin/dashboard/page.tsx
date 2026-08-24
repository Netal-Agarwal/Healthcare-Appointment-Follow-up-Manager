import React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Card from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || !session.user?.id) return (<div className="p-4">Unauthorized</div>);
  if (session.user.role !== "ADMIN") return (<div className="p-4">Forbidden</div>);

  const totalDoctors = await prisma.user.count({ where: { role: 'DOCTOR' } });

  const start = new Date(); start.setHours(0,0,0,0);
  const end = new Date(); end.setHours(23,59,59,999);
  const apptsToday = await prisma.appointment.count({ where: { slot: { startTime: { gte: start, lte: end } } } });

  const upcomingLeave = await prisma.leaveDay.count({ where: { date: { gt: new Date() } } });

  const failedNotifications = await prisma.notification.count({ where: { status: 'FAILED' } });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Admin dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-sm text-slate-500">Total doctors</div>
          <div className="text-2xl font-medium mt-2">{totalDoctors}</div>
        </Card>

        <Card>
          <div className="text-sm text-slate-500">Appointments today</div>
          <div className="text-2xl font-medium mt-2">{apptsToday}</div>
        </Card>

        <Card>
          <div className="text-sm text-slate-500">Upcoming leave days</div>
          <div className="text-2xl font-medium mt-2">{upcomingLeave}</div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Failed notifications</div>
              <div className="text-2xl font-medium mt-2">{failedNotifications}</div>
            </div>
            {failedNotifications > 0 && <Badge variant="high">Reliability alert</Badge>}
          </div>
        </Card>
      </div>
    </div>
  );
}
