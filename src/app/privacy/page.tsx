"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function PrivacyPage() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(localStorage.getItem("tm-theme") === "dark");
  }, []);

  const bg = dark ? "bg-[#0f0f0f]" : "bg-[#FDFBF8]";
  const text = dark ? "text-white" : "text-[#1a1a1a]";
  const muted = dark ? "text-[#9B9098]" : "text-[#6B6068]";
  const border = dark ? "border-[#3A3540]" : "border-[#EDE8E0]";

  return (
    <div className={`min-h-screen ${bg} ${text} font-sans`}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Back link */}
        <Link href="/" className="text-[#C9956E] hover:underline text-sm mb-10 inline-block">
          ← Back to TableMate
        </Link>

        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className={`text-sm ${muted} mb-12`}>Last updated: April 2025</p>

        <p className={`${muted} mb-12 leading-relaxed`}>
          TableMate (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) takes your privacy seriously. This policy explains what data we collect, why we collect it, and how we use it when you use our wedding seating planner service.
        </p>

        {/* Section */}
        <section className={`border-t ${border} pt-8 mb-10`}>
          <h2 className="text-xl font-semibold mb-4">1. Data We Collect</h2>
          <ul className={`space-y-2 ${muted} leading-relaxed list-disc list-inside`}>
            <li><strong className={text}>Account information</strong> — your name and email address when you sign up.</li>
            <li><strong className={text}>Wedding & guest data</strong> — event names, guest names, table arrangements, dietary notes, and RSVPs that you enter into the app.</li>
            <li><strong className={text}>Payment information</strong> — billing details processed by Stripe. We never store raw card numbers.</li>
            <li><strong className={text}>Usage data</strong> — pages visited, features used, and error logs to improve the product.</li>
            <li><strong className={text}>Cookies</strong> — a session cookie to keep you logged in, and a theme preference stored in localStorage.</li>
          </ul>
        </section>

        <section className={`border-t ${border} pt-8 mb-10`}>
          <h2 className="text-xl font-semibold mb-4">2. How We Use Your Data</h2>
          <ul className={`space-y-2 ${muted} leading-relaxed list-disc list-inside`}>
            <li>To provide and operate the TableMate service.</li>
            <li>To send transactional emails (invites, RSVPs, receipts) via Resend.</li>
            <li>To process subscription payments via Stripe.</li>
            <li>To troubleshoot bugs and improve performance.</li>
            <li>To contact you about important service updates. We do not send marketing emails without consent.</li>
          </ul>
          <p className={`${muted} mt-4 leading-relaxed`}>
            We do not sell, rent, or trade your personal data to any third party.
          </p>
        </section>

        <section className={`border-t ${border} pt-8 mb-10`}>
          <h2 className="text-xl font-semibold mb-4">3. Third-Party Services</h2>
          <p className={`${muted} mb-4 leading-relaxed`}>We rely on trusted third-party providers to run TableMate:</p>
          <div className="space-y-4">
            <div>
              <p className="font-medium">Supabase</p>
              <p className={`${muted} text-sm leading-relaxed`}>Our database and authentication provider. Your account and wedding data is stored on Supabase-managed PostgreSQL servers. See <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#C9956E] hover:underline">supabase.com/privacy</a>.</p>
            </div>
            <div>
              <p className="font-medium">Stripe</p>
              <p className={`${muted} text-sm leading-relaxed`}>Handles all payment processing for Pro subscriptions. Stripe stores your payment method securely. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#C9956E] hover:underline">stripe.com/privacy</a>.</p>
            </div>
            <div>
              <p className="font-medium">Resend</p>
              <p className={`${muted} text-sm leading-relaxed`}>Sends transactional emails on our behalf (RSVP links, invitations). See <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#C9956E] hover:underline">resend.com/privacy</a>.</p>
            </div>
          </div>
        </section>

        <section className={`border-t ${border} pt-8 mb-10`}>
          <h2 className="text-xl font-semibold mb-4">4. Data Retention</h2>
          <p className={`${muted} leading-relaxed`}>
            We retain your account and wedding data for as long as your account is active. If you delete your account, we permanently delete all associated data within 30 days, except where we are required to retain it for legal or financial compliance (e.g. billing records). Guest data you enter — names, dietary requirements, RSVPs — is deleted when you delete the associated wedding or your account.
          </p>
        </section>

        <section className={`border-t ${border} pt-8 mb-10`}>
          <h2 className="text-xl font-semibold mb-4">5. Your Rights</h2>
          <p className={`${muted} leading-relaxed`}>
            Depending on your location, you may have the right to access, correct, or delete your personal data. You can export your guest list at any time from within the app. To request account deletion or a data export, contact us below.
          </p>
        </section>

        <section className={`border-t ${border} pt-8 mb-10`}>
          <h2 className="text-xl font-semibold mb-4">6. Contact</h2>
          <p className={`${muted} leading-relaxed`}>
            Questions about this policy? Email us at{" "}
            <a href="mailto:privacy@tablemate.app" className="text-[#C9956E] hover:underline">privacy@tablemate.app</a>. We aim to respond within 48 hours.
          </p>
        </section>
      </div>
    </div>
  );
}
