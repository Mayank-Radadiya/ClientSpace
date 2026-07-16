import { Hero } from "@/components/landing/Hero";
import { LogoMarquee } from "@/components/landing/LogoMarquee";
import { FeatureTabs } from "@/components/landing/FeatureTabs";
import { StatsSection } from "@/components/landing/StatsSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Comparison } from "@/components/landing/Comparison";
import { Testimonials } from "@/components/landing/Testimonials";
import { FaqSection } from "@/components/landing/FaqSection";
import { Pricing } from "@/components/landing/Pricing";
import { FinalCta } from "@/components/landing/FinalCta";

export default function MarketingPage() {
  return (
    <>
      <Hero />
      <LogoMarquee />
      <FeatureTabs />
      <StatsSection />
      <HowItWorks />
      <Comparison />
      <Testimonials />
      <Pricing />
      <FaqSection />
      <FinalCta />
    </>
  );
}
