import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useFormStatus } from "react-dom";
import { motion } from "motion/react";

const MotionButton = motion(Button);

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <MotionButton
      type="submit"
      size="lg"
      whileTap={{ scale: 0.98 }}
      className="group relative w-full overflow-hidden rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 ease-out disabled:shadow-none"
      disabled={pending || disabled}
    >
      <span className="relative z-10 flex items-center justify-center gap-2 font-medium text-white">
        {pending ? "Initializing workspace..." : "Launch workspace"}
        {!pending && (
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
        )}
      </span>
      <div className="group-hover:animate-shimmer absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-all duration-1000" />
    </MotionButton>
  );
}

export default SubmitButton;
