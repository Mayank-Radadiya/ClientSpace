import { Hero } from "@/components/landing/Hero";
import { LogoCloud } from "@/components/landing/LogoCloud";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { BentoFeatures } from "@/components/landing/BentoFeatures";
import { WorkflowSection } from "@/components/landing/WorkflowSection";
import { SocialProof } from "@/components/landing/SocialProof";
import { PricingSection } from "@/components/landing/PricingSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { CtaSection } from "@/components/landing/CtaSection";

export default function MarketingPage() {
  return (
    <div className="flex flex-col items-center w-full overflow-hidden">
      <Hero />
      <LogoCloud />
      <ProblemSection />
      <FeatureShowcase />
      <BentoFeatures />
      <WorkflowSection />
      <SocialProof />
      <PricingSection />
      <FaqSection />
      <CtaSection />
    </div>
  );
}
