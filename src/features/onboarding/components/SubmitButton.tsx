import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useFormStatus } from "react-dom";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className="group relative w-full overflow-hidden"
      disabled={pending || disabled}
    >
      <span className="relative z-10 flex items-center justify-center gap-2 font-medium text-white">
        {pending ? "Initializing workspace..." : "Launch workspace"}
        {!pending && (
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        )}
      </span>
      <div className="group-hover:animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </Button>
  );
}

export default SubmitButton;
