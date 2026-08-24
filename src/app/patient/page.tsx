import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import PatientDashboard from "./dashboard/page";
export default async function PatientPage() { const user = await getSession(); if (!user) redirect("/auth/login"); if (user.role !== "PATIENT") redirect(user.role === "DOCTOR" ? "/doctor" : "/admin"); return <PatientDashboard />; }
