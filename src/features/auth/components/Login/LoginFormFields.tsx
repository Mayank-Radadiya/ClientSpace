import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useLoginForm from "./useLoginForm";
import { Loader } from "lucide-react";
import { PasswordField } from "../PasswordField";
import { useEffect } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { gooeyToast } from "@/components/ui/goey-toaster";

function LoginFormFields() {
  const {
    register,
    handleSubmit,
    handleLogin,
    state,
    isSubmitting,
    formState,
  } = useLoginForm();

  useEffect(() => {
    if (state?.error) {
      gooeyToast.error(state.error);
    }
  }, [state?.error]);
  return (
    <>
      <form
        className="space-y-4"
        aria-busy={isSubmitting}
        onSubmit={handleSubmit(handleLogin)}
      >
        {/* Email */}
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-foreground text-sm font-medium"
          >
            Email address
          </Label>
          <Input
            id="email"
            {...register("email")}
            type="email"
            placeholder="name@company.com"
            required
            className="bg-background border-border/40 focus-visible:ring-primary/40 focus-visible:border-primary/50 h-10 items-center rounded-lg px-3 transition-all focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
            aria-invalid={!!formState.errors.email}
          />
          {formState.errors.email && (
            <p className="text-destructive text-xs">
              {formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-foreground text-sm font-medium">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-muted-foreground hover:text-primary text-xs font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordField {...register("password")} />
          {formState.errors.password && (
            <p className="text-destructive text-xs">
              {formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="group mt-2 h-10 w-full rounded-lg font-medium text-white shadow-none transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
        {state?.error && (
          <Alert
            variant="error"
            className="bg-destructive/10 border-destructive/20 text-destructive"
          >
            {state.error}
          </Alert>
        )}
      </form>
    </>
  );
}

export default LoginFormFields;
