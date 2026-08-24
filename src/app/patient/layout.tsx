import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/auth/login");
  if (user.role !== "PATIENT") redirect(user.role === "DOCTOR" ? "/doctor" : "/admin");
  return <>{children}</>;
}
