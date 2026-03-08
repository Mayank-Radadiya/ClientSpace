"use client";

import { useActionState } from "react";
import {
  onboardClientAction,
  type OnboardClientState,
} from "../server/onboardClientAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

const initialState: OnboardClientState = {};

export function AddClientForm() {
  const [state, formAction, isPending] = useActionState(
    onboardClientAction,
    initialState,
  );

  const router = useRouter();

  return (
    <Card className="mx-auto w-full max-w-md border-zinc-200 shadow-lg dark:border-zinc-800">
      <CardHeader className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100">
            <span className="text-sm font-bold text-zinc-50 dark:text-zinc-900">
              2
            </span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Add Your First Client
          </CardTitle>
        </div>
        <CardDescription className="text-base text-zinc-500 dark:text-zinc-400">
          Let's setup your first client in your new workspace.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
          {state.error && (
            <Alert
              variant="error"
              className="border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-sm font-medium">
              Company Name
            </Label>
            <Input
              id="companyName"
              name="companyName"
              placeholder="Acme Corp"
              required
              className="h-12 border-zinc-300 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
            />
            {state.fieldErrors?.companyName && (
              <p className="text-sm font-medium text-red-500">
                {state.fieldErrors.companyName[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName" className="text-sm font-medium">
              Primary Contact Name
            </Label>
            <Input
              id="contactName"
              name="contactName"
              placeholder="Jane Doe"
              required
              className="h-12 border-zinc-300 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
            />
            {state.fieldErrors?.contactName && (
              <p className="text-sm font-medium text-red-500">
                {state.fieldErrors.contactName[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Client Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jane@acme.com"
              required
              className="h-12 border-zinc-300 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
            />
            {state.fieldErrors?.email && (
              <p className="text-sm font-medium text-red-500">
                {state.fieldErrors.email[0]}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            disabled={isPending}
            className="h-12 w-full bg-zinc-950 text-base font-semibold text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {isPending ? "Adding Client..." : "Complete Setup"}
          </Button>
        </CardFooter>
        <CardFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="h-12 w-full bg-zinc-950 text-base font-semibold text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Skip
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
