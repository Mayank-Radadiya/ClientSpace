import Link from "next/link";

const LINK_COLS = {
  PRODUCT: [
    { name: "Features", href: "#" },
    { name: "Pricing", href: "#pricing" },
    { name: "Changelog", href: "#" },
    { name: "Roadmap", href: "#" },
  ],
  RESOURCES: [
    { name: "Help Center", href: "#" },
    { name: "Guides", href: "#" },
    { name: "Community", href: "#" },
    { name: "Status", href: "#" },
  ],
  LEGAL: [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "Security", href: "#" },
    { name: "Cookies", href: "#" },
  ],
  SOCIAL: [
    { name: "Twitter", href: "#" },
    { name: "GitHub", href: "#" },
    { name: "RSS", href: "#" },
    { name: "Email", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[#1a1a1a] bg-[#0a0a0a]">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none">
        <span className="font-display text-[clamp(80px,15vw,120px)] leading-none tracking-[-0.03em] text-[#fafafa] italic opacity-[0.03]">
          ClientSpace
        </span>
      </div>

      <div className="relative mx-auto max-w-[960px] px-6 py-20">
        <div className="mb-16">
          <div className="flex max-w-md gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 border border-[#333] bg-transparent px-4 py-3 font-mono text-[12px] text-[#fafafa] transition-colors outline-none placeholder:text-[#555] focus:border-[#555]"
            />
            <button className="border border-[#333] px-6 py-3 font-mono text-[11px] tracking-widest text-[#a0a0a0] uppercase transition-all duration-200 hover:border-[#555] hover:text-[#fafafa]">
              Subscribe
            </button>
          </div>
        </div>

        <p className="mb-16 max-w-xl font-sans text-[14px] leading-[1.7] text-[#a0a0a0]">
          Quiet is the product. Forty-one teams have run ClientSpace for ninety
          days. None of them have asked to go back.
        </p>

        <div className="mb-12 border-b border-[#1a1a1a]" />

        <div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-4">
          {Object.entries(LINK_COLS).map(([section, links]) => (
            <div key={section} className="space-y-4">
              <h4 className="font-mono text-[10px] tracking-[0.15em] text-[#555] uppercase">
                {section}
              </h4>
              {links.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block font-sans text-[13px] text-[#a0a0a0] transition-colors hover:text-[#fafafa]"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#1a1a1a] pt-6 md:flex-row">
          <span className="font-mono text-[10px] text-[#555]">
            © {new Date().getFullYear()} ClientSpace. All rights reserved.
          </span>
          <div className="flex gap-6 font-mono text-[10px] text-[#555]">
            <span>EMAIL</span>
            <span>TWITTER</span>
            <span>GITHUB</span>
            <span>RSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
