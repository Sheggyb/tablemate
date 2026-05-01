"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const PLAN_NAMES: Record<string, string> = {
  couple: "Couple",
  premium: "Premium",
  planner: "Planner Pro",
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = searchParams.get("plan") ?? "couple";
  const planName = PLAN_NAMES[plan] ?? plan;

  const [dark, setDark] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("tm-theme") === "dark") setDark(true);
    const t = setTimeout(() => router.push("/app"), 6000);
    return () => clearTimeout(t);
  }, [router]);

  const bg   = dark ? "bg-[#1A1718]" : "bg-[#FDFBF8]";
  const text = dark ? "text-[#F0EBE8]" : "text-[#2A2328]";
  const muted= dark ? "text-[#9B9098]" : "text-[#6B6068]";
  const card = dark ? "bg-[#242028] border-[#3A3540]" : "bg-white border-[#EDE8E0]";

  return (
    <div className={`min-h-screen ${bg} flex items-center justify-center px-6`}>
      <div className={`max-w-md w-full rounded-2xl border ${card} p-10 text-center shadow-xl`}>
        <div className="text-5xl mb-6">🎉</div>
        <h1 className={`font-playfair text-3xl font-bold ${text} mb-3`}>
          Welcome to {planName}!
        </h1>
        <p className={`${muted} mb-2`}>
          Your payment was successful. Your plan has been upgraded — enjoy all the new features!
        </p>
        <p className={`text-sm ${muted} mb-8`}>
          You'll be redirected to the app in a few seconds…
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/app"
            className="block w-full py-3 rounded-xl bg-[#C9956E] hover:bg-[#B8845D] text-white font-semibold transition-colors"
          >
            Go to the App →
          </Link>
          <Link
            href="/app/upgrade"
            className={`block w-full py-3 rounded-xl border font-semibold text-sm transition-colors ${
              dark
                ? "border-[#3A3540] text-[#9B9098] hover:border-[#C9956E] hover:text-[#C9956E]"
                : "border-[#EDE8E0] text-[#6B6068] hover:border-[#C9956E] hover:text-[#C9956E]"
            }`}
          >
            View All Plans
          </Link>
        </div>

        <p className="mt-8 text-xs text-[#9B9098]">
          🔒 Receipt sent to your email · Questions? Contact support
        </p>
      </div>
    </div>
  );
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF8] flex items-center justify-center"><div className="text-2xl">🎉</div></div>}>
      <SuccessContent />
    </Suspense>
  );
}
