"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";
import { inviteClientAction } from "../server/actions";
import { inviteClientSchema, type InviteClientInput } from "../schemas";

export function InviteClientDialog() {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteClientInput>({
    resolver: zodResolver(inviteClientSchema),
    defaultValues: {
      email: "",
      companyName: "",
      contactName: "",
    },
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await inviteClientAction(values);

    if ("error" in result) {
      if (typeof result.error === "string") {
        toast.error(result.error);
      } else {
        toast.error("Please fix the highlighted fields.");
      }
      return;
    }

    if (result.warning) {
      toast.warning(result.warning);
    } else {
      toast.success("Invitation sent successfully!");
    }

    reset();
    setOpen(false);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          reset();
        }
      }}
    >
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Invite Client
          </Button>
        }
      />

      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Invite Client</DialogTitle>
          <DialogDescription>
            Send a secure invitation email. The invite link expires in 72 hours.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 px-6 pb-2">
          <div className="space-y-2">
            <label htmlFor="invite-email" className="text-sm font-medium">
              Email address
            </label>
            <Input
              id="invite-email"
              type="email"
              placeholder="client@acme.com"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="invite-company" className="text-sm font-medium">
              Company name
            </label>
            <Input
              id="invite-company"
              placeholder="Acme Corp"
              aria-invalid={Boolean(errors.companyName)}
              {...register("companyName")}
            />
            {errors.companyName && (
              <p className="text-sm text-red-500">
                {errors.companyName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="invite-contact" className="text-sm font-medium">
              Contact name
            </label>
            <Input
              id="invite-contact"
              placeholder="Jane Smith"
              aria-invalid={Boolean(errors.contactName)}
              {...register("contactName")}
            />
            {errors.contactName && (
              <p className="text-sm text-red-500">
                {errors.contactName.message}
              </p>
            )}
          </div>

          <DialogFooter className="mt-4 px-0" variant="bare">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
