"use client";

import { cn } from "@/lib/utils";

type ClientAvatarProps = {
  companyName?: string | null;
  contactName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
};

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-12 w-12 text-base",
  lg: "h-20 w-20 text-2xl",
};

// Generate a consistent blue gradient based on the initial letter
function getGradient(initial: string): string {
  const gradients = [
    "from-[#4F7FFF] to-[#2D5BCC]",
    "from-[#3B6FEF] to-[#1D4ED8]",
    "from-[#6B95FF] to-[#4F7FFF]",
    "from-[#2563EB] to-[#1E40AF]",
    "from-[#3B82F6] to-[#2563EB]",
    "from-[#60A5FA] to-[#3B82F6]",
  ];
  const idx = initial.charCodeAt(0) % gradients.length;
  return gradients[idx] ?? "from-[#4F7FFF] to-[#2D5BCC]";
}

export function ClientAvatar({
  companyName,
  contactName,
  email,
  avatarUrl,
  size = "md",
  onClick,
}: ClientAvatarProps) {
  const displayName = companyName ?? contactName ?? email ?? "?";
  const initial = displayName.charAt(0).toUpperCase();
  const gradient = getGradient(initial);

  const sizeClass = SIZE_CLASSES[size];

  if (avatarUrl) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full",
          sizeClass,
          onClick && "cursor-pointer",
        )}
        onClick={onClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={displayName}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full bg-linear-to-br font-bold text-white select-none",
        sizeClass,
        gradient,
        onClick && "cursor-pointer hover:opacity-90 transition-opacity",
      )}
      onClick={onClick}
      title={displayName}
    >
      {initial}
    </div>
  );
}
