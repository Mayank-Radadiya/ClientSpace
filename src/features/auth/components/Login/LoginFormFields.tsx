import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useLoginForm from "./useLoginForm";
import { Loader, Lock, Mail, AlertCircle } from "lucide-react";
import { PasswordField } from "../PasswordField";
import { useEffect } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { gooeyToast } from "@/components/ui/goey-toaster";
import { motion } from "framer-motion";

const MotionButton = motion(Button);

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
        className="space-y-5"
        aria-busy={isSubmitting}
        onSubmit={handleSubmit(handleLogin)}
      >
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
              placeholder="name@company.com"
              required
              className="bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-primary/20 focus-visible:border-primary/40 focus-visible:shadow-[0_0_0_1px_theme(colors.primary/40%)] h-11 items-center rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 pr-3 pl-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-500"
              aria-invalid={!!formState.errors.email}
            />
          </div>
          {formState.errors.email && (
            <motion.p
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="text-destructive mt-1.5 flex items-center gap-1.5 text-xs font-medium"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {formState.errors.email.message}
            </motion.p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-foreground text-sm font-medium">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-muted-foreground hover:text-primary text-xs font-medium transition-colors hover:underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordField
            {...register("password")}
            leftIcon={<Lock className="h-4 w-4" />}
          />
          {formState.errors.password && (
            <motion.p
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="text-destructive mt-1.5 flex items-center gap-1.5 text-xs font-medium"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {formState.errors.password.message}
            </motion.p>
          )}
        </div>

        {/* Submit */}
        <MotionButton
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="group mt-2 h-11 w-full rounded-xl font-medium text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 ease-out"
        >
          {isSubmitting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </MotionButton>

        {state?.error && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Alert
              variant="error"
              className="bg-destructive/10 border-destructive/20 text-destructive mt-4 flex items-center gap-2 rounded-xl"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </Alert>
          </motion.div>
        )}
      </form>
    </>
  );
}

export default LoginFormFields;
