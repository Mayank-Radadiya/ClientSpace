import { FolderOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyProjectsProps = {
  onCreateClick?: () => void;
};

export function EmptyProjects({ onCreateClick }: EmptyProjectsProps) {
  return (
    <div className="animate-in fade-in zoom-in-95 flex flex-col items-center justify-center py-24 text-center duration-500">
      {/* Icon with glass effect */}
      <div className="relative mb-8">
        <div className="flex h-28 w-28 items-center justify-center rounded-4xl bg-linear-to-br from-blue-500/10 to-indigo-600/10 shadow-2xl ring-1 shadow-blue-500/10 ring-white/10 backdrop-blur-3xl">
          <FolderOpen className="h-12 w-12 text-blue-500/60" />
        </div>
        <div className="ring-background absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-purple-600 shadow-lg ring-2 shadow-purple-500/40">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Text with bolder tracking */}
      <h3 className="mb-2 text-xl font-black tracking-tighter">
        ARCHIVE EMPTY
      </h3>
      <p className="text-muted-foreground mb-10 max-w-sm px-4 text-xs leading-relaxed font-medium tracking-wide uppercase opacity-70">
        Deploy your first strategic initiative to begin managing
        high-performance deliverables and client acquisitions.
      </p>

      {/* CTA */}
      {onCreateClick && (
        <Button
          size="lg"
          onClick={onCreateClick}
          className="bg-primary hover:bg-primary/90 shadow-primary/20 h-12 rounded-xl px-8 font-black tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          START NEW PROJECT
        </Button>
      )}
    </div>
  );
}
