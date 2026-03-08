"use client";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createOrganizationAction,
  type CreateOrgState,
} from "../server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// useActionState is from react (React 19).
// Pending state is handled by useFormStatus inside the child SubmitButton.

const initialState: CreateOrgState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating..." : "Create workspace"}
    </Button>
  );
}

export function CreateOrgForm() {
  const [state, formAction] = useActionState(
    createOrganizationAction,
    initialState,
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create your workspace</CardTitle>
        <CardDescription>
          Set up your organization to start managing clients and projects.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <form action={formAction} className="space-y-6">
          {/* Global error */}
          {state.error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {state.error}
            </div>
          )}

          {/* Organization name */}
          <div className="space-y-2">
            <Label htmlFor="name">Organization name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Acme Design Studio"
              required
              minLength={2}
              maxLength={100}
            />
            {state.fieldErrors?.name && (
              <p className="text-destructive text-sm">
                {state.fieldErrors.name[0]}
              </p>
            )}
          </div>

          {/* Org type */}
          <div className="space-y-2">
            <Label htmlFor="type">I am a...</Label>
            <Select name="type" required>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="freelancer">Freelancer</SelectItem>
                <SelectItem value="agency">Agency / Team</SelectItem>
              </SelectContent>
            </Select>
            {state.fieldErrors?.type && (
              <p className="text-destructive text-sm">
                {state.fieldErrors.type[0]}
              </p>
            )}
          </div>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
