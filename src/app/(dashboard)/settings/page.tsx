import { redirect } from "next/navigation";

/**
 * Settings Page
 * -------------
 * The primary /settings route. Since settings currently consist primarily
 * of Billing & Payments, we perform a clean server-side redirect to
 * the /settings/billing sub-page.
 */
export default function SettingsPage() {
  redirect("/settings/billing");
}
