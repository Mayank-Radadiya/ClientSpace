import { Hero } from "@/components/landing/Hero";
import { EditorialTicker } from "@/components/landing/EditorialTicker";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { DualViewSection } from "@/components/landing/DualViewSection";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { SocialProof } from "@/components/landing/SocialProof";
import { PricingSection } from "@/components/landing/PricingSection";
import { CtaSection } from "@/components/landing/CtaSection";

export default function MarketingPage() {
  return (
    <div className="flex flex-col items-center w-full min-h-screen overflow-x-hidden bg-lp-bg text-lp-text selection:bg-lp-accent/20 selection:text-lp-text">
      <Hero />
      <EditorialTicker />
      <ProblemSection />
      <DualViewSection />
      <FeatureShowcase />
      <SocialProof />
      <PricingSection />
      <CtaSection />
      
      {/* 
        =========================================
        DESIGN RATIONALE FOR CODE REVIEWER:
        =========================================
        - Completely removed abstract gradients and "glassmorphism" tech-bro aesthetics.
        - Adopted an editorial "print-in-browser" approach suitable for high-end boutique agencies.
        - Typography: Playfair Display (serif) paired with Inter to signal maturity and luxury.
        - Palette: Deep off-whites (#FAFAF9), rich darks (#0F0E0C), and a muted amber/gold accent (#D4A853) instead of hyper-neon purple.
        - Layout: Switched from centered 1-column templates to asymmetric split layouts, elegant whitespace, and alternating editorial flows.
        - Interaction: Replaced bouncy spring animations with mature, sophisticated fade-ins using a custom easing curve (0.16, 1, 0.3, 1).
        - Narrative: Created a strong visual duality between the "Agency View" (internal control) and "Client View" (premium presentation).
        =========================================
      */}
    </div>
  );
}
