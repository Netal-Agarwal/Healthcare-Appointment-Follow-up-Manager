import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import DoctorDashboard from "./dashboard/page";
export default async function DoctorPage() { const user = await getSession(); if (!user) redirect("/auth/login"); if (user.role !== "DOCTOR") redirect(user.role === "ADMIN" ? "/admin" : "/patient"); return <DoctorDashboard />; }
