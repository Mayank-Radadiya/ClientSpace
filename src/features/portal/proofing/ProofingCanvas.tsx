"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, Loader2, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { trpc } from "@/lib/trpc/client";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InlinePopover, ThreadSidePanel, AnnotationsSidebar } from "./AnnotationPopover";
import type { Annotation } from "./types";

// Standard react-pdf styles for annotations & text layer selection
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure local worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface ProofingCanvasProps {
  assetUrl: string;
  assetType: "image" | "pdf";
  assetId: string;
  initialAnnotations: Annotation[];
  canAddAnnotations: boolean;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  currentUserRole: string;
}

export function ProofingCanvas({
  assetUrl,
  assetType,
  assetId,
  initialAnnotations,
  canAddAnnotations,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserRole,
}: ProofingCanvasProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [numPages, setNumPages] = useState<number | null>(null);
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };
  const [activePage, setActivePage] = useState<number>(1);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number; page: number | null } | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [showPulsingHint, setShowPulsingHint] = useState(initialAnnotations.length === 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const createAnnotationMutation = trpc.comments.createAnnotation.useMutation();
  const createReplyMutation = trpc.comments.createReply.useMutation();
  const resolveAnnotationMutation = trpc.comments.resolveAnnotation.useMutation();

  const isAgency = currentUserRole !== "client";

  // Hide pulsing hint after 6 seconds
  useEffect(() => {
    if (showPulsingHint) {
      const t = setTimeout(() => setShowPulsingHint(false), 6000);
      return () => clearTimeout(t);
    }
  }, [showPulsingHint]);

  // Supabase Realtime Synchronization
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`asset:${assetId}`);

    channel
      .on("broadcast", { event: "annotation:created" }, (payload: any) => {
        const comment = payload.payload?.comment || payload.comment;
        if (!comment) return;
        setAnnotations((prev) => {
          if (prev.some((a) => a.id === comment.id)) return prev;
          return [...prev, comment].sort(
            (a, b) => (a.metadata?.pinNumber ?? 0) - (b.metadata?.pinNumber ?? 0)
          );
        });
      })
      .on("broadcast", { event: "annotation:reply" }, (payload: any) => {
        const comment = payload.payload?.comment || payload.comment;
        if (!comment) return;
        setAnnotations((prev) =>
          prev.map((a) => {
            if (a.id === comment.parentId) {
              if (a.replies.some((r) => r.id === comment.id)) return a;
              return {
                ...a,
                replies: [...a.replies, comment].sort(
                  (x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime()
                ),
              };
            }
            return a;
          })
        );
      })
      .on("broadcast", { event: "annotation:resolved" }, (payload: any) => {
        const commentId = payload.payload?.commentId || payload.commentId;
        if (!commentId) return;
        setAnnotations((prev) => prev.filter((a) => a.id !== commentId));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [assetId]);

  // Click / Tap coordinate calculations
  const calculateCoords = (e: React.MouseEvent<HTMLDivElement>, pageNum: number | null) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = parseFloat((((e.clientX - rect.left) / rect.width) * 100).toFixed(2));
    const y = parseFloat((((e.clientY - rect.top) / rect.height) * 100).toFixed(2));
    return { x: Math.max(0, Math.min(x, 100)), y: Math.max(0, Math.min(y, 100)), page: pageNum };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>, pageNum: number | null) => {
    if (!canAddAnnotations) return;
    
    // Discard hints
    setShowPulsingHint(false);

    // If clicked exactly on a saved pin, do nothing (let the pin click handle it)
    if ((e.target as HTMLElement).closest(".annotation-pin-bubble")) {
      return;
    }

    const coords = calculateCoords(e, pageNum);
    setPendingPin(coords);
    setSelectedPinId(null); // Close active thread
  };

  // Mobile Long-press (500ms) support
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, pageNum: number | null) => {
    if (!canAddAnnotations) return;
    const touch = e.touches[0];
    if (!touch) return;

    // Trigger long press after 500ms
    touchTimerRef.current = setTimeout(() => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = parseFloat((((touch.clientX - rect.left) / rect.width) * 100).toFixed(2));
      const y = parseFloat((((touch.clientY - rect.top) / rect.height) * 100).toFixed(2));
      
      setPendingPin({
        x: Math.max(0, Math.min(x, 100)),
        y: Math.max(0, Math.min(y, 100)),
        page: pageNum,
      });
      setSelectedPinId(null);
      toast.success("Tap location selected!");
    }, 500);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
  };

  // Save new annotation pin
  const handleAddAnnotation = async (body: string) => {
    if (!pendingPin) return;
    setIsSaving(true);
    try {
      const comment = await createAnnotationMutation.mutateAsync({
        assetId,
        body,
        x: pendingPin.x,
        y: pendingPin.y,
        page: pendingPin.page,
      });
      setAnnotations((prev) =>
        [...prev, comment].sort(
          (a, b) => (a.metadata?.pinNumber ?? 0) - (b.metadata?.pinNumber ?? 0)
        )
      );
      setPendingPin(null);
      setSelectedPinId(comment.id); // Open comments thread
      toast.success("Feedback pin placed!");
    } catch (err: any) {
      toast.error(err.message || "Failed to drop pin.");
    } finally {
      setIsSaving(false);
    }
  };

  // Save reply to existing thread
  const handleAddReply = async (body: string) => {
    if (!selectedPinId) return;
    const reply = await createReplyMutation.mutateAsync({
      parentId: selectedPinId,
      body,
    });
    setAnnotations((prev) =>
      prev.map((a) => {
        if (a.id === selectedPinId) {
          return {
            ...a,
            replies: [...a.replies, reply],
          };
        }
        return a;
      })
    );
  };

  // Resolve existing thread
  const handleResolveAnnotation = async () => {
    if (!selectedPinId) return;
    try {
      await resolveAnnotationMutation.mutateAsync({ commentId: selectedPinId });
      setAnnotations((prev) => prev.filter((a) => a.id !== selectedPinId));
      setSelectedPinId(null);
      toast.success("Feedback pin resolved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve pin.");
    }
  };

  // Select Sidebar Item / Scroll & Anchor
  const handleSelectSidebarPin = (id: string, pageNum: number | null) => {
    setSelectedPinId(id);
    setPendingPin(null);
    if (pageNum) {
      setActivePage(pageNum);
      const el = document.getElementById(`pdf-page-${pageNum}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const selectedAnnotation = annotations.find((a) => a.id === selectedPinId) || null;

  return (
    <div
      className={cn(
        "flex bg-background border rounded-2xl shadow-xl overflow-hidden transition-all duration-300",
        isFullscreen ? "fixed inset-4 z-50 h-[calc(100vh-32px)]" : "h-[750px] w-full"
      )}
    >
      {/* 1. Sidebar Index Panel */}
      <AnnotationsSidebar
        annotations={annotations.filter((a) => !a.resolved)}
        resolvedAnnotations={annotations.filter((a) => a.resolved)}
        onSelectPin={handleSelectSidebarPin}
        openCount={annotations.filter((a) => !a.resolved).length}
      />

      {/* 2. Interactive Main Proofing Frame */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-muted/30">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-border bg-background px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight">Review Canvas</span>
          </div>

          <div className="flex items-center gap-2">
            {/* PDF Multi-page Jump Controls */}
            {assetType === "pdf" && numPages && numPages > 1 && (
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={activePage === 1}
                  onClick={() => {
                    const next = Math.max(1, activePage - 1);
                    setActivePage(next);
                    document.getElementById(`pdf-page-${next}`)?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs px-2 font-medium">
                  Page {activePage} of {numPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={activePage === numPages}
                  onClick={() => {
                    const next = Math.min(numPages, activePage + 1);
                    setActivePage(next);
                    document.getElementById(`pdf-page-${next}`)?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hover:bg-muted"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Workspace */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto p-8 flex flex-col items-center justify-start relative select-none"
        >
          {/* Pulsing overlay hint */}
          <AnimatePresence>
            {showPulsingHint && canAddAnnotations && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-4 z-30 flex items-center gap-2 bg-blue-600/90 text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm pointer-events-none animate-pulse"
              >
                <Info className="h-4 w-4 shrink-0" />
                <span>Click anywhere to drop feedback pins!</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Canvas Render Logic */}
          <div className="relative shadow-2xl border border-border/80 rounded-xl overflow-hidden bg-background">
            {assetType === "image" ? (
              <div className="relative inline-block max-w-full">
                {/* Image underlay */}
                <img
                  src={assetUrl}
                  alt="Asset Preview"
                  className="max-h-[600px] w-auto object-contain block pointer-events-none"
                />

                {/* Click / Touch overlay */}
                <div
                  className={cn(
                    "absolute inset-0 z-20 pointer-events-auto",
                    canAddAnnotations ? "cursor-crosshair" : "cursor-default"
                  )}
                  onClick={(e) => handleCanvasClick(e, null)}
                  onTouchStart={(e) => handleTouchStart(e, null)}
                  onTouchEnd={handleTouchEnd}
                />

                {/* Render pins */}
                {annotations
                  .filter((a) => !a.resolved && a.metadata && a.metadata.page === null)
                  .map((ann) => (
                    <AnnotationPin
                      key={ann.id}
                      annotation={ann}
                      onSelect={() => handleSelectSidebarPin(ann.id, null)}
                      active={selectedPinId === ann.id}
                    />
                  ))}

                {/* Render unsaved pending pin */}
                {pendingPin && pendingPin.page === null && (
                  <PendingPin x={pendingPin.x} y={pendingPin.y} />
                )}

                {/* Render inline comment popover */}
                {pendingPin && pendingPin.page === null && (
                  <InlinePopover
                    x={pendingPin.x}
                    y={pendingPin.y}
                    onSave={handleAddAnnotation}
                    onCancel={() => setPendingPin(null)}
                    isSaving={isSaving}
                  />
                )}
              </div>
            ) : (
              /* PDF Support (Phase E) */
              <div className="relative bg-muted/10 p-4 space-y-8 max-w-full">
                <Document
                  file={assetUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <div className="flex flex-col items-center justify-center p-12 gap-2">
                      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                      <span className="text-sm font-medium">Opening PDF...</span>
                    </div>
                  }
                >
                  {Array.from(new Array(numPages ?? 0), (_, index) => {
                    const pageNum = index + 1;
                    return (
                      <div
                        key={pageNum}
                        id={`pdf-page-${pageNum}`}
                        className="relative mx-auto border rounded-lg overflow-hidden bg-background shadow-md"
                        style={{ width: "fit-content" }}
                      >
                        <Page
                          pageNumber={pageNum}
                          width={650}
                          loading={
                            <div className="h-[800px] w-[650px] flex items-center justify-center bg-background/50">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          }
                        />

                        {/* Page Click Capture Overlay */}
                        <div
                          className={cn(
                            "absolute inset-0 z-20 pointer-events-auto",
                            canAddAnnotations ? "cursor-crosshair" : "cursor-default"
                          )}
                          onClick={(e) => handleCanvasClick(e, pageNum)}
                          onTouchStart={(e) => handleTouchStart(e, pageNum)}
                          onTouchEnd={handleTouchEnd}
                        />

                        {/* Render Page Pins */}
                        {annotations
                          .filter((a) => !a.resolved && a.metadata && a.metadata.page === pageNum)
                          .map((ann) => (
                            <AnnotationPin
                              key={ann.id}
                              annotation={ann}
                              onSelect={() => handleSelectSidebarPin(ann.id, pageNum)}
                              active={selectedPinId === ann.id}
                            />
                          ))}

                        {/* Unsaved page pin */}
                        {pendingPin && pendingPin.page === pageNum && (
                          <PendingPin x={pendingPin.x} y={pendingPin.y} />
                        )}

                        {/* Inline popover inside page coordinate space */}
                        {pendingPin && pendingPin.page === pageNum && (
                          <InlinePopover
                            x={pendingPin.x}
                            y={pendingPin.y}
                            onSave={handleAddAnnotation}
                            onCancel={() => setPendingPin(null)}
                            isSaving={isSaving}
                          />
                        )}
                      </div>
                    );
                  })}
                </Document>
              </div>
            )}
          </div>
        </div>

        {/* 3. Thread side panel */}
        <AnimatePresence>
          {selectedPinId && selectedAnnotation && (
            <ThreadSidePanel
              annotation={selectedAnnotation}
              onClose={() => setSelectedPinId(null)}
              onReply={handleAddReply}
              onResolve={handleResolveAnnotation}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              isAgency={isAgency}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Sub-Component: Saved Active Pin ──────────────────────────────────────────
interface AnnotationPinProps {
  annotation: Annotation;
  onSelect: () => void;
  active: boolean;
}

function AnnotationPin({ annotation, onSelect, active }: AnnotationPinProps) {
  if (!annotation.metadata) return null;
  const { x, y } = annotation.metadata;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="absolute z-30"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <motion.button
        type="button"
        onClick={onSelect}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 350, damping: 15 }}
        className={cn(
          "annotation-pin-bubble flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md ring-2 ring-white select-none transition-all active:scale-95 duration-150",
          active ? "bg-amber-500 hover:bg-amber-600 scale-110 z-40" : "bg-blue-500 hover:bg-blue-600"
        )}
      >
        {annotation.metadata.pinNumber}
      </motion.button>

      {/* Hover tooltip preview */}
      <AnimatePresence>
        {hovered && !active && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, delay: 0.2 }}
            className="absolute left-1/2 bottom-8 z-50 w-48 -translate-x-1/2 rounded bg-slate-900/90 text-white px-2 py-1.5 text-[10px] shadow-lg backdrop-blur-sm pointer-events-none line-clamp-2 truncate"
          >
            <p className="font-semibold leading-none text-slate-300">
              {annotation.author.name || annotation.author.email}
            </p>
            <p className="mt-1 text-slate-100 line-clamp-2">{annotation.body}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-Component: Pending Pin ──────────────────────────────────────────────
function PendingPin({ x, y }: { x: number; y: number }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute z-40 flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-blue-500 bg-blue-500/20 text-[10px] font-bold text-blue-600 opacity-80 ring-2 ring-white"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      ?
    </motion.div>
  );
}
