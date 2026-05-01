import Link from "next/link";
import { posts } from "./data";
import type { Metadata } from "next";
import BlogHeader from "./BlogHeader";

export const metadata: Metadata = {
  title: "Wedding Planning Blog — Tips, Guides & Inspiration | TableMate",
  description:
    "Practical wedding planning advice from the TableMate team. Seating chart tips, guest list strategies, and real-talk guides to help you plan a stress-free wedding.",
  openGraph: {
    title: "Wedding Planning Blog — Tips, Guides & Inspiration | TableMate",
    description:
      "Practical wedding planning advice from the TableMate team. Seating chart tips, guest list strategies, and real-talk guides.",
    url: "https://tablemate-beta.vercel.app/blog",
    type: "website",
  },
};

const tagColours: Record<string, string> = {
  Tips: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  Guide: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Inspiration: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-[#FDFBF8] dark:bg-[#1A1618] transition-colors">
      <BlogHeader />

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FDF4EC] border border-[#EDD5BC] rounded-full text-xs text-[#C9956E] font-medium mb-6">
            ✍️ Wedding Planning Advice
          </div>
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-[#2A2328] dark:text-[#F0EBE8] mb-4">
            The TableMate Wedding Blog
          </h1>
          <p className="text-lg text-[#6B6068] dark:text-[#9B9098] max-w-2xl mx-auto">
            Practical tips, honest guides, and wedding inspiration — from seating charts to guest lists, we've got you covered.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group bg-white dark:bg-[#242028] border border-[#EDE8E0] dark:border-[#3A3540] rounded-2xl overflow-hidden hover:shadow-lg hover:border-[#C9956E]/40 dark:hover:border-[#C9956E]/40 transition-all duration-200"
            >
              <Link href={`/blog/${post.slug}`} className="block p-6">
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tagColours[post.tag]}`}
                  >
                    {post.tag}
                  </span>
                  <span className="text-xs text-[#9B9098] dark:text-[#6B6068]">
                    {post.readingTime}
                  </span>
                </div>
                <h2 className="font-playfair text-lg font-bold text-[#2A2328] dark:text-[#F0EBE8] mb-3 group-hover:text-[#C9956E] transition-colors leading-snug">
                  {post.title}
                </h2>
                <p className="text-sm text-[#6B6068] dark:text-[#9B9098] leading-relaxed mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9B9098] dark:text-[#6B6068]">{post.date}</span>
                  <span className="text-xs font-medium text-[#C9956E] group-hover:underline">
                    Read more →
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center bg-[#FDF4EC] dark:bg-[#242028] border border-[#EDD5BC] dark:border-[#3A3540] rounded-2xl px-8 py-12">
          <h2 className="font-playfair text-3xl font-bold text-[#2A2328] dark:text-[#F0EBE8] mb-4">
            Ready to plan your perfect seating chart?
          </h2>
          <p className="text-[#6B6068] dark:text-[#9B9098] mb-8 max-w-xl mx-auto">
            TableMate is free for up to 50 guests — drag-and-drop tables, RSVP collection, meal tracking, and beautiful printable exports.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#C9956E] hover:bg-[#B8845D] text-white font-semibold rounded-xl transition-colors"
          >
            Start planning free ♥
          </Link>
        </div>
      </main>

      <footer className="border-t border-[#EDE8E0] dark:border-[#3A3540] mt-16 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-sm text-[#9B9098]">
          <span>© 2026 TableMate. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[#C9956E] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#C9956E] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
