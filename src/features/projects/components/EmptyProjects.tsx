type EmptyProjectsProps = {
  isFiltered?: boolean;
  onCreateClick?: () => void;
};

export function EmptyProjects({
  isFiltered,
  onCreateClick,
}: EmptyProjectsProps) {
  return (
    <div className="animate-in fade-in flex flex-col items-center justify-center py-24 text-center duration-300">
      {/* Geometric SVG illustration — no external images */}
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-6 opacity-30"
        aria-hidden="true"
      >
        <rect
          x="12"
          y="20"
          width="56"
          height="44"
          rx="4"
          stroke="currentColor"
          strokeWidth="2"
          className="text-blue-400"
        />
        <rect
          x="20"
          y="12"
          width="40"
          height="8"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
          className="text-blue-400"
        />
        <line
          x1="12"
          y1="34"
          x2="68"
          y2="34"
          stroke="currentColor"
          strokeWidth="2"
          className="text-blue-400"
        />
        <rect
          x="20"
          y="42"
          width="20"
          height="3"
          rx="1.5"
          fill="currentColor"
          className="text-blue-400"
        />
        <rect
          x="20"
          y="50"
          width="30"
          height="3"
          rx="1.5"
          fill="currentColor"
          className="text-muted-foreground opacity-50"
        />
        <rect
          x="20"
          y="58"
          width="14"
          height="3"
          rx="1.5"
          fill="currentColor"
          className="text-muted-foreground opacity-30"
        />
      </svg>

      <h3 className="text-foreground mb-2 text-lg font-semibold">
        {isFiltered ? "No projects match your filters" : "No projects yet"}
      </h3>
      <p className="text-muted-foreground mb-8 max-w-xs text-sm leading-relaxed">
        {isFiltered
          ? "Try adjusting your filters or search term to find what you're looking for."
          : "Create your first project to start tracking work, clients, and deadlines."}
      </p>

      {onCreateClick && (
        <button
          type="button"
          onClick={onCreateClick}
          className="focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-5 py-2.5 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {isFiltered ? "Clear filters" : "Create your first project →"}
        </button>
      )}
    </div>
  );
}
