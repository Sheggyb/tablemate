"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function UpgradeCancelPage() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("tm-theme") === "dark") setDark(true);
  }, []);

  const bg   = dark ? "bg-[#1A1718]" : "bg-[#FDFBF8]";
  const text = dark ? "text-[#F0EBE8]" : "text-[#2A2328]";
  const muted= dark ? "text-[#9B9098]" : "text-[#6B6068]";
  const card = dark ? "bg-[#242028] border-[#3A3540]" : "bg-white border-[#EDE8E0]";

  return (
    <div className={`min-h-screen ${bg} flex items-center justify-center px-6`}>
      <div className={`max-w-md w-full rounded-2xl border ${card} p-10 text-center shadow-xl`}>
        <div className="text-5xl mb-6">😕</div>
        <h1 className={`font-playfair text-3xl font-bold ${text} mb-3`}>
          Payment cancelled
        </h1>
        <p className={`${muted} mb-8`}>
          No worries — your card was not charged. You can upgrade any time to unlock unlimited guests and more features.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/app/upgrade"
            className="block w-full py-3 rounded-xl bg-[#C9956E] hover:bg-[#B8845D] text-white font-semibold transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/app"
            className={`block w-full py-3 rounded-xl border font-semibold text-sm transition-colors ${
              dark
                ? "border-[#3A3540] text-[#9B9098] hover:border-[#C9956E] hover:text-[#C9956E]"
                : "border-[#EDE8E0] text-[#6B6068] hover:border-[#C9956E] hover:text-[#C9956E]"
            }`}
          >
            Back to App
          </Link>
        </div>

        <p className="mt-8 text-xs text-[#9B9098]">
          Need help? Contact us at support@tablemate.app
        </p>
      </div>
    </div>
  );
}
