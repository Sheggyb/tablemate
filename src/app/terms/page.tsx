"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function TermsPage() {
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

        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className={`text-sm ${muted} mb-12`}>Last updated: April 2025</p>

        <p className={`${muted} mb-12 leading-relaxed`}>
          These Terms of Service govern your use of TableMate, a wedding seating planner operated by TableMate (&quot;we&quot;, &quot;us&quot;). By creating an account or using our service, you agree to these terms.
        </p>

        <section className={`border-t ${border} pt-8 mb-10`}>
          <h2 className="text-xl font-semibold mb-4">1. Use of Service</h2>
          <p className={`${muted} leading-relaxed`}>
            TableMate provides tools for planning wedding seating arrangements, managing guest lists, collecting RSVPs, and sharing seating charts. You must be at least 18 years old to create an account. You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account.
          </p>
        </section>

        <section className={`border-t ${border} pt-8 mb-10`}>
          <h2 className="text-xl font-semibold mb-4">2. Free vs Paid Plans</h2>
          <p className={`${muted} leading-relaxed mb-3`}>
            TableMate offers a <strong className={text}>Free plan</strong> with limited features and a <strong className={text}>Pro plan</strong> with full access. Feature limits for each plan are described on our pricing page and may change with notice.
          </p>
          <p className={`${muted} leading-relaxed`}>
            Free plan users may use the service for personal, non-commercial wedding planning. We reserve the right to adjust free-tier limits at any time.
          </p>
        </section>

        <section className={`border-t ${border} pt-8 mb-10`}>
          <h2 className="text-xl font-semibold mb-4">3. Payments &amp; Refunds</h2>
          <p className={`${muted} leading-relaxed mb-3`}>
            Pro subscriptions are billed monthly or annually via Stripe. All prices are displayed in USD. By subscribing, you authorise us to charge your payment method on a recurring basis until you cancel.
          </p>
          <p className={`${muted} leading-relaxed mb-3`}>
            You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period — you retain Pro access until then.
          </p>
          <p className={`${muted} leading-relaxed`}>
            We offer a <strong className={text}>7-day refund</strong> on new Pro subscriptions if you are not satisfied. Contact us at <a href="mailto:support@tablemate.app" className="text-[#C9956E] hover:underline">support@tablemate.app</a> within 7 days of your first charge. Refunds are not available after 7 days or for renewals.
          </p>
        </section>

        <section className={`border-t ${border} pt-8 mb-10`}>
          <h2 className="text-xl font-semibold mb-4">4. Prohibited Uses</h2>
          <p className={`${muted} mb-3 leading-relaxed`}>You agree not to:</p>
          <ul className={`space-y-2 ${muted} leading-relaxed list-disc list-inside`}>
            <li>Use TableMate for any unlawful purpose or in violation of any applicable law.</li>
            <li>Upload or store data that infringes on the rights of others.</li>
            <li>Attempt to gain unauthorised access to any part of the service or another user&apos;s account.</li>
            <li>Reverse-engineer, scrape, or reproduce any part of the service without permission.</li>
            <li>Resell or sublicense access to the service to third parties.</li>
          </ul>
        </section>

        <section className={`border-t ${border} pt-8 mb-10`}>
          <h2 className="text-xl font-semibold mb-4">5. Limitation of Liability</h2>
          <p className={`${muted} leading-relaxed mb-3`}>
            TableMate is provided &quot;as is&quot; without warranties of any kind. We do our best to keep the service reliable, but we do not guarantee uninterrupted or error-free operation.
          </p>
          <p className={`${muted} leading-relaxed`}>
            To the maximum extent permitted by law, TableMate shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service, including loss of data. Our total liability to you for any claim shall not exceed the amount you paid us in the 12 months preceding the claim.
          </p>
        </section>

        <section className={`border-t ${border} pt-8 mb-10`}>
          <h2 className="text-xl font-semibold mb-4">6. Changes to Terms</h2>
          <p className={`${muted} leading-relaxed`}>
            We may update these terms from time to time. We will notify you of material changes by email or via an in-app notice. Continued use of TableMate after changes take effect constitutes acceptance of the updated terms.
          </p>
        </section>

        <section className={`border-t ${border} pt-8 mb-10`}>
          <h2 className="text-xl font-semibold mb-4">7. Contact</h2>
          <p className={`${muted} leading-relaxed`}>
            Questions about these terms? Email us at{" "}
            <a href="mailto:legal@tablemate.app" className="text-[#C9956E] hover:underline">legal@tablemate.app</a>. We aim to respond within 48 hours.
          </p>
        </section>
      </div>
    </div>
  );
}
