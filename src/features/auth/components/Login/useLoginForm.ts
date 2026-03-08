// src/features/auth/components/Login/useLoginForm.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginFormType, loginSchema } from "../../schemas";
import { useActionState, useEffect, startTransition } from "react";
import { loginAction } from "../../server/actions";

export default function useLoginForm() {
  const { handleSubmit, register, formState, setError } =
    useForm<LoginFormType>({
      resolver: zodResolver(loginSchema),
      defaultValues: {
        email: "",
        password: "",
      },
    });

  const [state, formAction, isPending] = useActionState(loginAction, {});

  // Sync server-side validation errors back to React Hook Form
  useEffect(() => {
    if (state?.fieldErrors) {
      Object.entries(state.fieldErrors).forEach(([field, messages]) => {
        if (messages && messages.length > 0) {
          setError(field as keyof LoginFormType, {
            type: "server",
            message: messages[0],
          });
        }
      });
    }
  }, [state?.fieldErrors, setError]);

  const handleLogin = (data: LoginFormType) => {
    // Manually wrap the imperative call in a transition
    startTransition(() => {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);
      formAction(formData);
    });
  };

  const isSubmitting = isPending || formState.isSubmitting;

  return {
    register,
    handleSubmit,
    formState,
    handleLogin,
    state,
    isSubmitting,
  };
}
