"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-lp-bg border-t border-lp-border pt-24 pb-12 px-6 lg:px-16 relative z-10">
      <div className="max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-24">
          
          {/* Brand Column */}
          <div className="flex flex-col gap-6">
            <Link href="/" className="font-serif text-2xl tracking-tight text-lp-text font-bold">
              ClientSpace.
            </Link>
            <p className="text-lp-text-secondary text-sm font-body max-w-xs leading-relaxed">
              The operating system for independent studios and freelance professionals. Stop chasing clients, start creating.
            </p>
          </div>

          {/* Product Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-lp-text font-bold uppercase tracking-wider text-xs mb-2">Product</h4>
            <Link href="#features" className="text-lp-text-secondary hover:text-lp-text text-sm font-body transition-colors">Features</Link>
            <Link href="#pricing" className="text-lp-text-secondary hover:text-lp-text text-sm font-body transition-colors">Pricing</Link>
            <Link href="#" className="text-lp-text-secondary hover:text-lp-text text-sm font-body transition-colors">Security</Link>
            <Link href="#" className="text-lp-text-secondary hover:text-lp-text text-sm font-body transition-colors">Changelog</Link>
          </div>

          {/* Resources Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-lp-text font-bold uppercase tracking-wider text-xs mb-2">Resources</h4>
            <Link href="#" className="text-lp-text-secondary hover:text-lp-text text-sm font-body transition-colors">Help Center</Link>
            <Link href="#" className="text-lp-text-secondary hover:text-lp-text text-sm font-body transition-colors">Agency Guides</Link>
            <Link href="#" className="text-lp-text-secondary hover:text-lp-text text-sm font-body transition-colors">Templates</Link>
            <Link href="#" className="text-lp-text-secondary hover:text-lp-text text-sm font-body transition-colors">Community</Link>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col gap-4">
            <h4 className="text-lp-text font-bold uppercase tracking-wider text-xs mb-2">The Studio Letter</h4>
            <p className="text-lp-text-secondary text-sm font-body leading-relaxed mb-2">
              Essays on pricing, positioning, and running a profitable creative practice.
            </p>
            <div className="flex gap-2 relative border-b border-lp-text pb-2">
              <input 
                type="email" 
                placeholder="Email address" 
                className="bg-transparent border-none p-0 text-sm text-lp-text font-body w-full focus:outline-none focus:ring-0 placeholder:text-lp-text-secondary/50"
              />
              <button className="text-lp-text hover:text-lp-accent transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-t border-lp-border pt-8">
          <div className="text-lp-text-secondary text-xs font-body">
            &copy; {new Date().getFullYear()} ClientSpace Inc. All rights reserved.
          </div>
          <div className="flex gap-6 text-xs text-lp-text-secondary font-body">
            <Link href="/terms" className="hover:text-lp-text transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-lp-text transition-colors">Privacy Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
