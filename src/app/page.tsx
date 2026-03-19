"use client";
import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-xl space-y-6 p-8 font-sans">
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
          href="/dashboard"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
