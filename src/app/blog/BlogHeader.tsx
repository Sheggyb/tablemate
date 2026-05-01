"use client";
import Link from "next/link";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function BlogHeader({ activeSlug }: { activeSlug?: string }) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#1A1618]/90 border-b border-[#EDE8E0] dark:border-[#3A3540] backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-[#C9956E] text-xl">♥</span>
          <span className="font-playfair text-xl font-semibold text-[#2A2328] dark:text-[#F0EBE8]">
            TableMate
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-[#6B6068] dark:text-[#9B9098]">
          <a href="/#features" className="hover:text-[#C9956E] transition-colors">Features</a>
          <a href="/#faq"      className="hover:text-[#C9956E] transition-colors">FAQ</a>
          <Link href="/pricing" className="hover:text-[#C9956E] transition-colors">Pricing</Link>
          <Link href="/blog" className="text-[#C9956E] font-medium">Blog</Link>
        </nav>
        <div className="flex items-center gap-3">
          <DarkModeToggle />
          <Link href="/login"  className="px-4 py-2 text-sm font-medium rounded-lg border-2 border-[#C9956E] text-[#C9956E] hover:bg-[#C9956E] hover:text-white transition-colors">Sign in</Link>
          <Link href="/signup" className="px-4 py-2 bg-[#C9956E] hover:bg-[#B8845D] text-white text-sm font-medium rounded-lg transition-colors">Get Started</Link>
        </div>
      </div>
    </header>
  );
}
