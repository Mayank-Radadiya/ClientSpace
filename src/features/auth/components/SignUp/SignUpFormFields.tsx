import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useSignUpForm from "./useSignUpForm";
import { Loader, User, Mail, Lock } from "lucide-react";
import { PasswordField } from "../PasswordField";
import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { gooeyToast } from "@/components/ui/goey-toaster";

function SignUpFormFields() {
  const {
    register,
    handleSubmit,
    handleSignUp,
    state,
    isSubmitting,
    formState,
  } = useSignUpForm();

  useEffect(() => {
    if (state?.error) {
      gooeyToast.error(state.error);
    }
  }, [state?.error]);

  return (
    <>
      <form
        className="space-y-5"
        aria-busy={isSubmitting}
        onSubmit={handleSubmit(handleSignUp)}
      >
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-foreground text-sm font-medium">
            Full Name
          </Label>
          <div className="relative flex items-center justify-between">
            <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-4 w-4" />
            </div>
            <Input
              id="name"
              {...register("name")}
              type="text"
              placeholder="John Doe"
              required
              className="bg-muted/40 hover:bg-muted/80 focus-visible:bg-background focus-visible:ring-primary/40 focus-visible:border-primary/50 h-11 items-center rounded-xl border-transparent pr-3 pl-10 shadow-sm transition-all focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
              aria-invalid={!!formState.errors.name}
            />
          </div>
          {formState.errors.name && (
            <p className="text-destructive text-xs">
              {formState.errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label
            htmlFor="email"
            className="text-foreground text-sm font-medium"
          >
            Email address
          </Label>
          <div className="relative flex items-center justify-between">
            <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-4 w-4" />
            </div>
            <Input
              id="email"
              {...register("email")}
              type="email"
              placeholder="m@example.com"
              required
              className="bg-muted/40 hover:bg-muted/80 focus-visible:bg-background focus-visible:ring-primary/40 focus-visible:border-primary/50 h-11 items-center rounded-xl border-transparent pr-3 pl-10 shadow-sm transition-all focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
              aria-invalid={!!formState.errors.email}
            />
          </div>
          {formState.errors.email && (
            <p className="text-destructive text-xs">
              {formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-foreground text-sm font-medium">
              Password
            </Label>
          </div>
          <PasswordField
            {...register("password")}
            leftIcon={<Lock className="h-4 w-4" />}
          />
          {formState.errors.password && (
            <p className="text-destructive text-xs">
              {formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-foreground text-sm font-medium">
              Confirm Password
            </Label>
          </div>
          <PasswordField
            {...register("confirmPassword")}
            leftIcon={<Lock className="h-4 w-4" />}
          />
          {formState.errors.confirmPassword && (
            <p className="text-destructive text-xs">
              {formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="group mt-2 h-11 w-full rounded-xl font-medium text-white shadow-sm transition-all active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Sign up"
          )}
        </Button>

        {state?.error && (
          <Alert
            variant="error"
            className="bg-destructive/10 border-destructive/20 text-destructive mt-4"
          >
            {state.error}
          </Alert>
        )}
      </form>
    </>
  );
}

export default SignUpFormFields;
