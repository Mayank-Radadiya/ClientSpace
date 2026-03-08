/**
 * AuthLayout (Route Layout)
 * ------------------------
 * Layout wrapper for all authentication-related routes.
 *
 * This layout:
 *  - Applies a shared authentication UI structure
 *  - Ensures consistent background, branding, and navigation
 *  - Wraps all auth pages (sign-in, sign-up, etc.) automatically
 *
 * The actual visual implementation is delegated to
 * `AuthLayoutStructure` to keep routing concerns separate from UI logic.
 */

import AuthLayoutStructure from "@/features/auth/components/AuthLayoutStructure";

interface AuthLayoutProps {
  children: React.ReactNode; // Auth page content rendered inside the layout
}

const AuthLayout = async ({ children }: AuthLayoutProps) => {
  return (
    <>
      {/* Shared authentication layout structure */}
      <AuthLayoutStructure>{children}</AuthLayoutStructure>{" "}
    </>
  );
};

export default AuthLayout;
