'use client';

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Grid, Folder, Users, Receipt, Paperclip, Activity, Settings, Bell, CheckCircle2 } from "lucide-react";

export function HeroDashboardMockup() {
  const shouldReduceMotion = useReducedMotion();
  
  // Simulated hover state for the sidebar items loop
  const [hoveredIndex, setHoveredIndex] = useState(-1);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setHoveredIndex(1); // Hover 'Projects'
      setTimeout(() => setHoveredIndex(-1), 1000);
    }, 5000);
    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  return (
    <div className="relative z-10 mx-auto w-full max-w-[1100px]">
      <motion.div
        initial={{ opacity: 0, y: 48, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.8 }}
        className="relative"
      >
        <motion.div
          animate={shouldReduceMotion ? {} : { y: [0, -6, 0] }}
          transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
          className="relative overflow-hidden rounded-t-xl border border-b-0 border-[#1F1F1F] bg-[#111111] max-md:h-[55vh]"
          aria-hidden="true"
          role="presentation"
        >
          {/* BorderBeam Effect */}
          <div className="absolute inset-0 z-50 pointer-events-none rounded-t-xl overflow-hidden [mask-image:linear-gradient(black,transparent)]">
            <div className="absolute top-0 left-0 h-full w-[200px] animate-[border-beam_8s_linear_infinite] bg-gradient-to-b from-[#6366F1] to-[#818CF8] opacity-50 blur-[3px]" style={{ animationDelay: '0.8s' }} />
          </div>

          {/* Browser Chrome */}
          <div className="flex h-[40px] items-center border-b border-[#1A1A1A] bg-[#0D0D0D] px-[14px]">
            <div className="flex gap-[8px]">
              <div className="h-3 w-3 rounded-full bg-[#FF5F57]" />
              <div className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
              <div className="h-3 w-3 rounded-full bg-[#28C840]" />
            </div>
            <div className="mx-auto flex h-[24px] w-[220px] items-center justify-center gap-2 rounded-md border border-[#252525] bg-[#1A1A1A]">
              <span className="text-[10px]">🔒</span>
              <span className="font-mono text-[12px] text-[#525252]">app.clientspace.io</span>
            </div>
            <div className="w-[52px]" /> {/* Spacer to balance traffic lights */}
          </div>

          {/* Dashboard Layout */}
          <div className="flex max-md:flex-col">
            {/* Sidebar (hidden on very small screens or rendered as top bar, but mockups usually keep it for realism unless extreme mobile) */}
            <div className="hidden w-[220px] shrink-0 border-r border-[#161616] bg-[#0D0D0D] p-5 pb-[20px] md:flex md:flex-col">
              {/* Logo & Org */}
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-[#6366F1]/10 text-[#6366F1]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                </div>
                <div>
                  <div className="text-[13px] font-medium text-[#FAFAFA]">Riviera Studio</div>
                  <div className="text-[11px] text-[#525252]">Pro plan</div>
                </div>
              </div>

              {/* Nav */}
              <nav className="flex flex-1 flex-col gap-2">
                <div className="flex h-[36px] items-center gap-3 rounded-md border border-[#252525] bg-[#1A1A1A] px-2.5 text-[#FAFAFA]">
                  <Grid className="h-4 w-4 text-[#6366F1]" />
                  <span className="text-[13px]">Dashboard</span>
                </div>
                
                <motion.div 
                  animate={{ 
                    backgroundColor: hoveredIndex === 1 ? "#161616" : "transparent",
                    color: hoveredIndex === 1 ? "#A3A3A3" : "#525252"
                  }}
                  className="flex h-[36px] items-center justify-between rounded-md px-2.5 text-[#525252]"
                >
                  <div className="flex items-center gap-3">
                    <Folder className="h-4 w-4 text-[#3A3A3A]" />
                    <span className="text-[13px]">Projects</span>
                  </div>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1A1A1A] text-[10px] text-[#A3A3A3]">4</span>
                </motion.div>

                <div className="flex h-[36px] items-center justify-between rounded-md px-2.5 text-[#525252]">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-[#3A3A3A]" />
                    <span className="text-[13px]">Clients</span>
                  </div>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1A1A1A] text-[10px] text-[#A3A3A3]">12</span>
                </div>

                <div className="flex h-[36px] items-center justify-between rounded-md px-2.5 text-[#525252]">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-4 w-4 text-[#3A3A3A]" />
                    <span className="text-[13px]">Invoices</span>
                  </div>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#F59E0B]/20 text-[10px] text-[#F59E0B]">2</span>
                </div>

                <div className="flex h-[36px] items-center gap-3 rounded-md px-2.5 text-[#525252]">
                  <Paperclip className="h-4 w-4 text-[#3A3A3A]" />
                  <span className="text-[13px]">Files</span>
                </div>

                <div className="flex h-[36px] items-center gap-3 rounded-md px-2.5 text-[#525252]">
                  <Activity className="h-4 w-4 text-[#3A3A3A]" />
                  <span className="text-[13px]">Activity</span>
                </div>
              </nav>

              {/* User profile */}
              <div className="mt-auto flex items-center justify-between pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1E1E2E] text-[11px] font-medium text-white/80">RK</div>
                  <span className="text-[12px] text-[#A3A3A3]">Ryan K.</span>
                </div>
                <Settings className="h-3.5 w-3.5 text-[#3A3A3A]" />
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-[#111111] p-6">
              {/* Top Bar */}
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-medium text-[#FAFAFA]">Good morning, Ryan</h2>
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2A2A2A]">
                    <Bell className="h-4 w-4 text-[#A3A3A3]" />
                  </div>
                  <div className="h-8 w-8 rounded-full bg-[#1E1E2E]" />
                </div>
              </div>

              {/* Metrics */}
              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { title: "Active Projects", value: "8", label: "Active", delta: "↑ 2 this month", color: "#FAFAFA", deltaColor: "#10B981" },
                  { title: "Outstanding", value: "$3,200", label: "Owed to you", delta: "2 invoices", color: "#F59E0B", deltaColor: "#525252" },
                  { title: "Revenue MTD", value: "$12,400", label: "This month", delta: "↑ 18% vs last", color: "#FAFAFA", deltaColor: "#10B981" },
                  { title: "Approvals", value: "3", label: "Pending", delta: "Awaiting clients", color: "#FAFAFA", deltaColor: "#F59E0B" }
                ].map((metric, i) => (
                  <div key={i} className="flex flex-col gap-1 rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] px-4 py-3.5">
                    <div className="text-[11px] text-[#525252]">{metric.title}</div>
                    <div className="text-[22px] font-semibold" style={{ color: metric.color }}>{metric.value}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] text-[#525252]">{metric.label}</span>
                      <span className="text-[11px]" style={{ color: metric.deltaColor }}>{metric.delta}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Projects Table */}
              <div className="mt-5">
                <div className="flex items-center rounded-md bg-[#0D0D0D] px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#525252]">
                  <div className="w-[25%]">Project</div>
                  <div className="w-[25%]">Client</div>
                  <div className="w-[20%]">Status</div>
                  <div className="w-[15%]">Due</div>
                  <div className="w-[15%] text-right">Health</div>
                </div>

                <div className="flex flex-col">
                  {/* Row 1 */}
                  <div className="flex h-[44px] items-center border-b border-[#161616] px-4 text-[13px]">
                    <div className="w-[25%] font-medium text-[#FAFAFA]">Luminary Rebrand</div>
                    <div className="w-[25%] text-[#A3A3A3]">Acme Corp</div>
                    <div className="w-[20%]">
                      <span className="inline-flex items-center rounded-[4px] border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-400">
                        In Progress
                      </span>
                    </div>
                    <div className="w-[15%] text-[#A3A3A3]">Jun 15</div>
                    <div className="w-[15%] flex justify-end">
                      <HealthRing score={87} color="#10B981" delay={1.2} />
                    </div>
                  </div>
                  {/* Row 2 */}
                  <div className="flex h-[44px] items-center border-b border-[#161616] px-4 text-[13px]">
                    <div className="w-[25%] font-medium text-[#FAFAFA]">Portal Launch</div>
                    <div className="w-[25%] text-[#A3A3A3]">Riviera Co</div>
                    <div className="w-[20%]">
                      <span className="inline-flex items-center rounded-[4px] border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-500">
                        Review
                      </span>
                    </div>
                    <div className="w-[15%] text-[#A3A3A3]">Jun 20</div>
                    <div className="w-[15%] flex justify-end">
                      <HealthRing score={62} color="#F59E0B" delay={1.4} />
                    </div>
                  </div>
                  {/* Row 3 */}
                  <div className="flex h-[44px] items-center border-b border-[#161616] px-4 text-[13px]">
                    <div className="w-[25%] font-medium text-[#FAFAFA]">Q2 Campaign</div>
                    <div className="w-[25%] text-[#A3A3A3]">Studio X</div>
                    <div className="w-[20%]">
                      <span className="inline-flex items-center rounded-[4px] border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500">
                        On Track
                      </span>
                    </div>
                    <div className="w-[15%] text-[#A3A3A3]">Jul 01</div>
                    <div className="w-[15%] flex justify-end">
                      <HealthRing score={91} color="#10B981" delay={1.6} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Feed */}
              <div className="mt-4">
                <h3 className="mb-2 text-[12px] font-medium text-[#525252]">Recent Activity</h3>
                <div className="flex flex-col">
                  <ActivityItem 
                    delay={1.1}
                    avatar={{ initials: "SC", color: "#1E1E2E" }}
                    content={<>Sarah Chen approved <span className="font-medium text-[#FAFAFA]">homepage.fig</span></>}
                    time="2m ago"
                  />
                  <ActivityItem 
                    delay={1.3}
                    avatar={{ initials: "JM", color: "#1E2E1E" }}
                    content={<>Jake moved 'API Work' to <span className="inline-flex items-center gap-1 font-medium text-[#A3A3A3]"><div className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />Done</span></>}
                    time="14m ago"
                  />
                  <ActivityItem 
                    delay={1.5}
                    avatar={{ initials: "CS", color: "#1F1A2E" }}
                    content={<>Invoice INV-0042 sent to Acme Corp — <span className="text-[#10B981]">$2,400</span></>}
                    time="1h ago"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Product Glow below mockup */}
      <div className="pointer-events-none absolute bottom-[-60px] left-1/2 -z-10 h-[120px] w-[80%] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(99,102,241,0.2)_0%,transparent_70%)] blur-[40px]" />
    </div>
  );
}

function HealthRing({ score, color, delay }: { score: number, color: string, delay: number }) {
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  
  return (
    <div className="relative flex h-6 w-6 items-center justify-center">
      <svg className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="12" cy="12" r={radius} fill="none" stroke="#252525" strokeWidth="2" />
        <motion.circle 
          cx="12" cy="12" r={radius} 
          fill="none" 
          stroke={color} 
          strokeWidth="2"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
          transition={{ duration: 1, delay, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <span className="font-mono text-[9px] text-[#A3A3A3]">{score}</span>
    </div>
  );
}

function ActivityItem({ delay, avatar, content, time }: { delay: number, avatar: { initials: string, color: string }, content: React.ReactNode, time: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-center gap-3 border-b border-[#161616] py-2"
    >
      <div 
        className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] text-white/80"
        style={{ backgroundColor: avatar.color }}
      >
        {avatar.initials}
      </div>
      <div className="flex-1 text-[12px] text-[#A3A3A3]">{content}</div>
      <div className="text-[11px] text-[#3A3A3A]">{time}</div>
    </motion.div>
  );
}
