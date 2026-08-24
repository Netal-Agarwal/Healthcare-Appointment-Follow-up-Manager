import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminDashboard from "./dashboard/page";
export default async function AdminPage() { const user = await getSession(); if (!user) redirect("/auth/login"); if (user.role !== "ADMIN") redirect(user.role === "DOCTOR" ? "/doctor" : "/patient"); return <AdminDashboard />; }
