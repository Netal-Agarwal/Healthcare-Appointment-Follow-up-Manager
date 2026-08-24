import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/auth/login");
  if (user.role !== "DOCTOR") redirect(user.role === "ADMIN" ? "/admin" : "/patient");
  return <>{children}</>;
}
