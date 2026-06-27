import { redirect } from "next/navigation";
import { getServerCaller } from "@/lib/trpc/server";
import { MessagesPageClient } from "./MessagesPageClient";

export const metadata = { title: "Messages" };

export default async function PortalMessagesPage() {
  const caller = await getServerCaller();
  if (!caller) redirect("/login");

  const branding = await caller.portal.orgBranding();

  return <MessagesPageClient brandName={branding?.name ?? "Support"} />;
}
