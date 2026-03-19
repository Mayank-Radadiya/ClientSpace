import { redirect } from "next/navigation";
import WorkspaceShell from "./_components/DashboardShell";
import { getUser } from "@/lib/auth/getUser";
import { requireOrg } from "@/lib/auth/requireOrg";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  await requireOrg(user.id);
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
