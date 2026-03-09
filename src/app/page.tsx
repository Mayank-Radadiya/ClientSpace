"use client";
import { useTheme } from "next-themes";
import { useState, useTransition } from "react";
import { createTestUser } from "./actions";
import Link from "next/link";
import { gooeyToast } from "@/components/ui/goey-toaster";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  const handleTestDatabase = () => {
    startTransition(async () => {
      const promise = createTestUser();

      gooeyToast.promise(promise, {
        loading: "Creating test user...",
        success: "Test user created successfully!",
        error: "Failed to create test user.",
        description: {
          loading: "Creating test user...",
          success: "Test user created successfully!",
          error: "Failed to create test user.",
        },
        action: {
          success: {
            label: "View User",
            onClick: () => {
              console.log("View User");
            },
          },
          error: {
            label: "Retry",
            onClick: () => {
              console.log("Retry");
            },
          },
        },
        spring: false,
        bounce: 0.01,
        timing: {
          displayDuration: 6000,
        },
      });

      const response = await promise;

      if (response.success) {
        setResult(`Success! Created user with email: ${response.email}`);
      } else {
        setResult(`Error: ${response.error}`);
      }
    });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 p-8 font-sans">
      <h1 className="text-3xl font-bold">ClientSpace Setup Complete</h1>

      <div className="space-x-4">
        <button
          className="rounded bg-gray-200 px-4 py-2 font-medium dark:bg-gray-800"
          onClick={() => setTheme("light")}
        >
          Light
        </button>
        <button
          className="rounded bg-gray-200 px-4 py-2 font-medium dark:bg-gray-800"
          onClick={() => setTheme("dark")}
        >
          Dark
        </button>
        <button
          className="rounded bg-gray-200 px-4 py-2 font-medium dark:bg-gray-800"
          onClick={() => setTheme("system")}
        >
          System
        </button>
      </div>

      <div className="space-y-4 rounded-lg border p-6">
        <h2 className="text-xl font-semibold">Database Connection Test</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Click the button below to execute a Drizzle Server Action that writes
          to your Supabase Postgres database.
        </p>

        <button
          onClick={handleTestDatabase}
          disabled={isPending}
          className="rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Connecting to Supabase..." : "Create Test User"}
        </button>

        {result && (
          <div
            className={`rounded p-4 text-sm ${result.startsWith("Success") ? "border border-green-200 bg-green-100 text-green-800" : "border border-red-200 bg-red-100 text-red-800"}`}
          >
            <pre className="whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>

      <p> Basic route for navigation and testing</p>
      <div className="flex w-full items-center gap-4">
        <Link
          className="rounded-md border border-gray-200 px-4 py-2 font-medium dark:border-gray-800 dark:bg-gray-800"
          href="/login"
        >
          Login
        </Link>
        <Link
          className="rounded-md border border-gray-200 px-4 py-2 font-medium dark:border-gray-800 dark:bg-gray-800"
          href="/signup"
        >
          Signup
        </Link>
        <Link
          className="rounded-md border border-gray-200 px-4 py-2 font-medium dark:border-gray-800 dark:bg-gray-800"
          href="/reset-password"
        >
          Reset Password
        </Link>
        <Link
          className="rounded-md border border-gray-200 px-4 py-2 font-medium dark:border-gray-800 dark:bg-gray-800"
          href="/dashboard"
        >
          Dashboard
        </Link>
        <Link
          className="rounded-md border border-gray-200 px-4 py-2 font-medium dark:border-gray-800 dark:bg-gray-800"
          href="/settings"
        >
          Settings
        </Link>
      </div>

      <button
        onClick={() =>
          gooeyToast.success("Success! This is a gooey toast.", {
            description: "This is a description",
            bounce: 0.05,
            spring: false,
          })
        }
        className="rounded-md bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-700"
      >
        Show Gooey Toast
      </button>

      <button
        onClick={() =>
          gooeyToast.promise(createTestUser(), {
            loading: "Loading...",
            success: "Success!",
            error: "Error!",
          })
        }
        className="rounded-md bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-700"
      >
        Show Gooey Error Toast
      </button>
    </div>
  );
}
