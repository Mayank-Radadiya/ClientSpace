#!/bin/bash
components=("Nav" "Hero" "LogoCloud" "ProblemSection" "FeatureShowcase" "BentoFeatures" "WorkflowSection" "SocialProof" "PricingSection" "FaqSection" "CtaSection" "Footer")

for comp in "${components[@]}"; do
  cat << INNER_EOF > src/components/landing/${comp}.tsx
export function ${comp}() {
  return (
    <section className="w-full relative py-24 px-6 md:px-12">
      <div className="mx-auto max-w-7xl">
        <h2>${comp} Placeholder</h2>
      </div>
    </section>
  );
}
INNER_EOF
done
