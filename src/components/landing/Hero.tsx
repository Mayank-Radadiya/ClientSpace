'use client';

import { HeroBackground } from "./hero/HeroBackground";
import { HeroEyebrow } from "./hero/HeroEyebrow";
import { HeroHeadline } from "./hero/HeroHeadline";
import { HeroSubheadline } from "./hero/HeroSubheadline";
import { HeroCTAGroup } from "./hero/HeroCTAGroup";
import { HeroSocialProof } from "./hero/HeroSocialProof";
import { HeroDashboardMockup } from "./hero/HeroDashboardMockup";
import { HeroMouseGlow } from "./hero/HeroMouseGlow";

export function Hero() {
  return (
    <section 
      role="banner" 
      aria-label="Hero"
      className="relative flex w-full min-h-screen flex-col items-center overflow-hidden pb-0 pt-[80px] md:pt-[64px]"
    >
      <HeroBackground />
      <HeroMouseGlow />
      
      {/* Text Content */}
      <div className="relative z-10 flex w-full max-w-[720px] flex-col items-center px-6">
        <HeroEyebrow />
        <div className="h-[20px]" />
        <HeroHeadline />
        <div className="h-[24px]" />
        <HeroSubheadline />
        <div className="h-[40px]" />
        <HeroCTAGroup />
        <div className="h-[48px]" />
        <HeroSocialProof />
      </div>

      <div className="h-[80px]" />
      
      {/* Mockup */}
      <div className="relative z-10 w-full md:px-6 lg:px-0">
        <HeroDashboardMockup />
      </div>
    </section>
  );
}
