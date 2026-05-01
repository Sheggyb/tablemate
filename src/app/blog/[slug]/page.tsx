import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, posts } from "../data";
import type { Metadata } from "next";
import BlogHeader from "../BlogHeader";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} | TableMate Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://tablemate-beta.vercel.app/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
    },
  };
}

const tagColours: Record<string, string> = {
  Tips: "bg-rose-100 text-rose-700",
  Guide: "bg-amber-100 text-amber-700",
  Inspiration: "bg-violet-100 text-violet-700",
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-[#FDFBF8] dark:bg-[#1A1618] transition-colors">
      <BlogHeader />

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-[#9B9098]">
          <Link href="/blog" className="hover:text-[#C9956E] transition-colors">← Back to Blog</Link>
        </nav>

        {/* Article header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tagColours[post.tag]}`}>
              {post.tag}
            </span>
            <span className="text-xs text-[#9B9098]">{post.date}</span>
            <span className="text-xs text-[#9B9098]">·</span>
            <span className="text-xs text-[#9B9098]">{post.readingTime}</span>
          </div>
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-[#2A2328] dark:text-[#F0EBE8] leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-lg text-[#6B6068] dark:text-[#9B9098] leading-relaxed">
            {post.excerpt}
          </p>
        </header>

        <hr className="border-[#EDE8E0] dark:border-[#3A3540] mb-10" />

        {/* Article body */}
        <article
          className="prose prose-lg max-w-none
            prose-headings:font-playfair prose-headings:text-[#2A2328] dark:prose-headings:text-[#F0EBE8]
            prose-p:text-[#3A3038] dark:prose-p:text-[#C8C0BD] prose-p:leading-relaxed
            prose-li:text-[#3A3038] dark:prose-li:text-[#C8C0BD]
            prose-strong:text-[#2A2328] dark:prose-strong:text-[#F0EBE8]
            prose-a:text-[#C9956E] prose-a:no-underline hover:prose-a:underline
            [&_.cta-box]:bg-[#FDF4EC] dark:[&_.cta-box]:bg-[#242028]
            [&_.cta-box]:border [&_.cta-box]:border-[#EDD5BC] dark:[&_.cta-box]:border-[#3A3540]
            [&_.cta-box]:rounded-xl [&_.cta-box]:p-6 [&_.cta-box]:my-8
            [&_.cta-box_p]:text-[#3A3038] dark:[&_.cta-box_p]:text-[#C8C0BD] [&_.cta-box_p]:!mb-0
          "
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <hr className="border-[#EDE8E0] dark:border-[#3A3540] my-12" />

        {/* Bottom CTA */}
        <div className="bg-[#FDF4EC] dark:bg-[#242028] border border-[#EDD5BC] dark:border-[#3A3540] rounded-2xl px-8 py-10 text-center">
          <h2 className="font-playfair text-2xl font-bold text-[#2A2328] dark:text-[#F0EBE8] mb-3">
            Plan your seating chart with TableMate
          </h2>
          <p className="text-[#6B6068] dark:text-[#9B9098] mb-6 max-w-md mx-auto">
            Professional seating charts. Drag-and-drop tables, RSVP collection, meal tracking, and printable exports.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#C9956E] hover:bg-[#B8845D] text-white font-semibold rounded-xl transition-colors"
          >
            Try TableMate ♥
          </Link>
        </div>

        {/* Back to blog */}
        <div className="mt-10 text-center">
          <Link href="/blog" className="text-sm text-[#C9956E] hover:underline">
            ← More articles from the TableMate blog
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
