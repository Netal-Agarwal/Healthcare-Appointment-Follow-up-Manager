import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/auth/login");
  if (user.role !== "ADMIN") redirect(user.role === "DOCTOR" ? "/doctor" : "/patient");
  return <>{children}</>;
}
