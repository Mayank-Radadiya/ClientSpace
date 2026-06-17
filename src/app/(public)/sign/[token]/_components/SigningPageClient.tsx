"use client";

// src/app/(public)/sign/[token]/_components/SigningPageClient.tsx
// Client-facing contract signing UI.
//
// Features:
//   - Scrollable contract body (pre-sanitized by server)
//   - IntersectionObserver sentinel at contract bottom → unlocks signing
//   - Two-tab signature capture: Type (cursive CSS font) / Draw (canvas)
//   - Canvas: mouse + PointerEvents for touch, prevents page scroll while drawing
//   - "I agree to sign electronically" checkbox
//   - Submit disabled until: scrolled + name + email valid + checkbox checked

import { useCallback, useEffect, useRef, useState } from "react";
import { signContractAction } from "./signContract";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Eraser, Pencil, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SigningPageClientProps {
  contractId: string;
  token: string;
  title: string;
  sanitizedHtml: string;
  signerEmail: string;
  emailSuffix: string;
  org: { name: string; logoUrl: string | null };
}

type TabMode = "type" | "draw";

// ─── Component ────────────────────────────────────────────────────────────────

export function SigningPageClient({
  contractId,
  token,
  title,
  sanitizedHtml,
  signerEmail: initialEmail,
  emailSuffix,
  org,
}: SigningPageClientProps) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [tab, setTab] = useState<TabMode>("type");
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState(initialEmail);
  const [agreed, setAgreed] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [emailConfirmValue, setEmailConfirmValue] = useState("");
  const emailConfirmError = emailConfirmValue.length > 0 && emailConfirmValue !== emailSuffix ? "Email suffix does not match." : null;

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Scroll sentinel ref
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── Scroll sentinel ────────────────────────────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry!.isIntersecting) setHasScrolled(true);
      },
      { threshold: 0.9 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // ── Canvas drawing ─────────────────────────────────────────────────────────
  function getPoint(e: PointerEvent | MouseEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const clientX = "clientX" in e ? e.clientX : 0;
    const clientY = "clientY" in e ? e.clientY : 0;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    lastPointRef.current = getPoint(e.nativeEvent, canvas);
    // Prevent page scroll while drawing
    e.preventDefault();
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPointRef.current) return;

    const current = getPoint(e.nativeEvent, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(current.x, current.y);
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastPointRef.current = current;
    setHasDrawn(true);
    e.preventDefault();
  }, []);

  const onPointerUp = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signerEmail);
  const nameValid = signerName.trim().length >= 2;
  const signatureReady = tab === "type" ? nameValid : hasDrawn;
  const canSubmit = hasScrolled && nameValid && emailValid && agreed && signatureReady;

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSign() {
    if (!canSubmit) return;
    setIsPending(true);
    setError(null);

    try {
      let signatureDataUrl: string | undefined;

      if (tab === "draw") {
        const canvas = canvasRef.current;
        signatureDataUrl = canvas?.toDataURL("image/png");
      }

      await signContractAction({
        token,
        contractId,
        signerName: signerName.trim(),
        signerEmail: signerEmail.trim(),
        signatureDataUrl,
        tabMode: tab,
      });
    } catch (err) {
      setError("Signing failed. Please try again or contact the sender.");
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Agency header */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        {org.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={org.logoUrl} alt={org.name} className="h-8 object-contain" />
        ) : (
          <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">{org.name}</span>
        )}
        <span className="text-neutral-300 dark:text-neutral-700">·</span>
        <span className="text-sm text-neutral-500">Contract for your signature</span>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Contract title */}
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{title}</h1>

        {/* Scroll-to-unlock notice */}
        {!hasScrolled && (
          <div className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2.5 flex items-center gap-2">
            <span>↓</span>
            Please scroll through the entire contract before signing.
          </div>
        )}

        {/* Contract body */}
        <div
          className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm px-8 py-8 prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />

        {/* Scroll sentinel — signing unlocks when this is visible */}
        <div ref={sentinelRef} className="h-1" aria-hidden="true" />

        {/* Signature capture section */}
        <div
          className={cn(
            "rounded-xl border bg-white dark:bg-neutral-900 overflow-hidden transition-opacity duration-300",
            hasScrolled
              ? "border-neutral-200 dark:border-neutral-800 opacity-100"
              : "border-neutral-100 dark:border-neutral-900 opacity-40 pointer-events-none",
          )}
          id="signature-section"
        >
          {/* Email verification */}
          {!emailConfirmed && (
            <div className="rounded-xl border bg-white dark:bg-neutral-900 p-6 space-y-4">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Verify your email</h2>
              <p className="text-sm text-neutral-500">
                Please type the last 4 characters of the email address that received this signing link.
              </p>
              <Input
                placeholder="e.g. .com"
                value={emailConfirmValue}
                onChange={(e) => setEmailConfirmValue(e.target.value)}
              />
              {emailConfirmError && (
                <p className="text-sm text-red-500">{emailConfirmError}</p>
              )}
              <Button
                onClick={() => {
                  if (emailConfirmValue === emailSuffix) setEmailConfirmed(true);
                }}
                disabled={emailConfirmValue !== emailSuffix}
                className="w-full"
              >
                Confirm Email
              </Button>
            </div>
          )}

          {emailConfirmed && (<>
          <div className="p-6 space-y-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Your details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="signer-name">Full name</Label>
                <Input
                  id="signer-name"
                  placeholder="Jane Smith"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signer-email">Email address</Label>
                <Input
                  id="signer-email"
                  type="email"
                  placeholder="jane@company.com"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>
          </div>

          {/* Signature tabs */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Your signature</h2>
            </div>

            {/* Tab switcher */}
            <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden w-fit">
              {(["type", "draw"] as TabMode[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  id={`signature-tab-${t}`}
                  onClick={() => setTab(t)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 text-sm transition-colors",
                    tab === t
                      ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium"
                      : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800",
                  )}
                >
                  {t === "type" ? <Type size={13} /> : <Pencil size={13} />}
                  {t === "type" ? "Type" : "Draw"}
                </button>
              ))}
            </div>

            {/* Type mode */}
            {tab === "type" && (
              <div className="space-y-2">
                <div
                  className="h-24 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800/50"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic" }}
                >
                  {signerName ? (
                    <span className="text-3xl text-[#1e3a5f] dark:text-blue-200" style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>
                      {signerName}
                    </span>
                  ) : (
                    <span className="text-neutral-400 text-sm">Your name will appear here</span>
                  )}
                </div>
                <p className="text-xs text-neutral-400">Typed signatures are rendered as your legal signature.</p>
              </div>
            )}

            {/* Draw mode */}
            {tab === "draw" && (
              <div className="space-y-2">
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    id="signature-canvas"
                    width={600}
                    height={150}
                    className="w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 touch-none cursor-crosshair"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerUp}
                    style={{ touchAction: "none" }}
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-sm text-neutral-400">Draw your signature here</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                >
                  <Eraser size={12} />
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Agreement + submit */}
          <div className="px-6 pb-6 space-y-4 border-t border-neutral-100 dark:border-neutral-800 pt-4">
            <label className="flex items-start gap-3 cursor-pointer" id="agree-label">
              <input
                type="checkbox"
                id="agree-checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                I agree to use electronic signatures for this document and understand that my electronic signature is as legally binding as a handwritten signature.
              </span>
            </label>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <Button
              id="sign-document-btn"
              className="w-full gap-2 h-11"
              disabled={!canSubmit || isPending}
              onClick={handleSign}
            >
              {isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <CheckCircle2 size={15} />
              )}
              {isPending ? "Signing…" : "Sign Document"}
            </Button>

            {!hasScrolled && (
              <p className="text-xs text-center text-neutral-400">
                Scroll through the contract to enable signing.
              </p>
            )}
          </div></>)}

          {!emailConfirmed && (
            <p className="text-sm text-center text-neutral-400">
              Verify your email above to access the signing form.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
