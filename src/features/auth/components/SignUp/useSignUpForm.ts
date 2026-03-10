import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignupInput, signupSchema } from "../../schemas";
import { useActionState, useEffect, startTransition } from "react";
import { signupAction } from "../../server/actions";

export default function useSignUpForm() {
  const { handleSubmit, register, formState, setError } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const [state, formAction, isPending] = useActionState(signupAction, {});

  // Sync server-side validation errors back to React Hook Form
  useEffect(() => {
    if (state?.fieldErrors) {
      Object.entries(state.fieldErrors).forEach(([field, messages]) => {
        if (messages && messages.length > 0) {
          setError(field as keyof SignupInput, {
            type: "server",
            message: messages[0],
          });
        }
      });
    }
  }, [state?.fieldErrors, setError]);

  const handleSignUp = (data: SignupInput) => {
    startTransition(() => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("confirmPassword", data.confirmPassword);
      formAction(formData);
    });
  };

  const isSubmitting = isPending || formState.isSubmitting;

  return {
    register,
    handleSubmit,
    formState,
    handleSignUp,
    state,
    isSubmitting,
  };
}
