"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const OrbitingCircles = dynamic(() => import("@/components/ui/orbiting-circles").then(mod => mod.OrbitingCircles), { ssr: false });
const Marquee = dynamic(() => import("@/components/ui/marquee").then(mod => mod.Marquee), { ssr: false });

const reviews = [
  {
    name: "Sarah Jenkins",
    username: "@sarahj_design",
    body: "ClientSpace completely changed how my agency operates. No more lost emails or missed payments.",
    img: "https://i.pravatar.cc/150?img=1",
  },
  {
    name: "Michael Chen",
    username: "@mchen_dev",
    body: "The automated invoices alone save me 5 hours a week. My clients love the professional portal.",
    img: "https://i.pravatar.cc/150?img=2",
  },
  {
    name: "Emma Watson",
    username: "@emma_creates",
    body: "Finally, a tool that looks as good as the work we deliver to our clients.",
    img: "https://i.pravatar.cc/150?img=3",
  },
  {
    name: "David Kim",
    username: "@dkim_studio",
    body: "Setup took 5 minutes. The Stripe integration is flawless. Highly recommended.",
    img: "https://i.pravatar.cc/150?img=4",
  },
  {
    name: "Olivia Martinez",
    username: "@olivia_m",
    body: "It feels like having a full-time project manager on the team. Outstanding.",
    img: "https://i.pravatar.cc/150?img=5",
  },
];

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
}) => {
  return (
    <figure
      className="relative w-80 cursor-pointer overflow-hidden rounded-xl border p-6 mx-4 bg-background hover:bg-muted/50 transition-colors"
    >
      <div className="flex flex-row items-center gap-2">
        <img className="rounded-full" width="40" height="40" alt="" src={img} />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium text-foreground">
            {name}
          </figcaption>
          <p className="text-xs font-medium text-muted-foreground">{username}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-1 mb-2">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
        ))}
      </div>
      <blockquote className="mt-2 text-sm text-muted-foreground">{body}</blockquote>
    </figure>
  );
};

export function SocialProof() {
  return (
    <section className="w-full pt-24 md:pt-32 pb-0 bg-background relative overflow-hidden flex flex-col items-center">
      <div className="mx-auto max-w-7xl px-6 md:px-12 mb-10 text-center relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold tracking-tight mb-6"
        >
          Plays nice with your stack
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto mb-16"
        >
          Connect the tools you already use. ClientSpace syncs seamlessly with your favorite apps to keep your workflow uninterrupted.
        </motion.p>

        <div className="relative flex h-[400px] w-full max-w-[600px] mx-auto items-center justify-center overflow-hidden">
          <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-foreground to-muted-foreground/30 bg-clip-text text-center text-8xl font-semibold leading-none text-transparent">
            Stack
          </span>
          
          <OrbitingCircles radius={80} duration={20}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border text-black font-bold text-xs">Slack</div>
          </OrbitingCircles>
          <OrbitingCircles radius={80} duration={20} delay={10}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 shadow-sm border text-white font-bold text-xs">Stripe</div>
          </OrbitingCircles>
          
          <OrbitingCircles radius={140} duration={30} reverse>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border text-black font-bold text-xs">Figma</div>
          </OrbitingCircles>
          <OrbitingCircles radius={140} duration={30} delay={15} reverse>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 shadow-sm border text-black font-bold text-xs">Zapier</div>
          </OrbitingCircles>
        </div>
      </div>

      <div className="w-full relative flex flex-col items-center justify-center overflow-hidden py-24 bg-muted/30 border-t border-border/50">
        <div className="mb-12 text-center">
          <h3 className="text-2xl font-bold tracking-tight">Loved by agencies worldwide</h3>
        </div>
        <Marquee pauseOnHover className="[--duration:40s]">
          {reviews.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-muted/30 to-transparent"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-muted/30 to-transparent"></div>
      </div>
    </section>
  );
}
