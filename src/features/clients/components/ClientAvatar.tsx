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
  md: "h-10 w-10 text-[14px]",
  lg: "h-12 w-12 text-[16px]",
};

// Generate a consistent gradient based on the initial letter
function getGradient(initial: string): string {
  const char = initial.toUpperCase();
  if (char >= 'A' && char <= 'E') return "from-[#3B6FEF] to-[#6B95FF]";
  if (char >= 'F' && char <= 'J') return "from-[#0D9488] to-[#2DD4BF]";
  if (char >= 'K' && char <= 'O') return "from-[#7C3AED] to-[#A78BFA]";
  if (char >= 'P' && char <= 'T') return "from-[#E11D48] to-[#FB7185]";
  if (char >= 'U' && char <= 'Z') return "from-[#D97706] to-[#FCD34D]";
  return "from-[#3B6FEF] to-[#6B95FF]";
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
        "relative flex shrink-0 items-center justify-center rounded-full bg-linear-to-br font-[var(--font-display)] font-bold text-white select-none",
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
