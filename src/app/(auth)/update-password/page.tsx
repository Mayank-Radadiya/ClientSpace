import { Metadata } from "next";
import { UpdatePasswordForm } from "@/features/auth/components/UpdatePasswordForm";

export const metadata: Metadata = {
  title: "Update Password",
  description: "Securely update your ClientSpace account password",
};

export default function UpdatePasswordPage() {
  return (
    <div className="w-full">
      <UpdatePasswordForm />
    </div>
  );
}
