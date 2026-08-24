import React from "react";
import { CheckCircle, AlertTriangle, Bell, Clock, CalendarCheck } from "lucide-react";

export type BadgeProps = {
  variant?: "low" | "medium" | "high";
  status?: "booked" | "confirmed" | "cancelled" | "pending";
  children?: React.ReactNode;
  className?: string;
};

export function Badge({ variant, status, children, className = "" }: BadgeProps) {
  const urgencyMap: Record<string, string> = {
    low: "bg-green-100 text-green-800 dark:bg-green-900/30",
    medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30",
    high: "bg-red-100 text-red-800 dark:bg-red-900/30",
  };

  const statusMap: Record<string, string> = {
    booked: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
    confirmed: "bg-teal-100 text-teal-800 dark:bg-teal-900/20",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30",
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30",
  };

  if (status) {
    const Icon = status === "confirmed" ? CheckCircle : status === "pending" ? Clock : status === "cancelled" ? AlertTriangle : CalendarCheck;
    return (
      <span className={["inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium", statusMap[status], className].filter(Boolean).join(" ")}>
        <Icon className="h-3 w-3" />
        {children}
      </span>
    );
  }

  const tone = variant ? urgencyMap[variant] : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100";
  const Icon = variant === "low" ? CheckCircle : variant === "medium" ? Bell : variant === "high" ? AlertTriangle : null;
  return (
    <span className={["inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium", tone, className].filter(Boolean).join(" ")}>
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {children}
    </span>
  );
}

export default Badge;
