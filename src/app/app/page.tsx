import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AppDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: weddings } = await supabase.from("weddings").select("*").eq("user_id", user.id).order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#FDFBF8]">
      {/* Header */}
      <header className="bg-white border-b border-[#EDE8E0] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#C9956E] text-xl">♥</span>
            <span className="font-playfair text-xl font-semibold text-[#2A2328]">TableMate</span>
          </div>
          <div className="flex items-center gap-4">
            {profile?.plan === 'free' && (
              <Link href="/app/upgrade" className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 bg-[#FDF4EC] border border-[#EDD5BC] text-[#C9956E] text-xs font-semibold rounded-full hover:bg-[#FDE8D0] transition-colors">
                ✨ Upgrade
              </Link>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#C9956E] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm text-[#4A4348]">{profile?.full_name || user.email}</span>
            </div>
            <form action="/auth/signout" method="POST">
              <button className="text-sm text-[#9B9098] hover:text-[#2A2328] transition-colors">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-playfair text-2xl font-bold text-[#2A2328]">Your Weddings</h1>
            <p className="text-sm text-[#6B6068] mt-1">
              {profile?.plan === 'free' ? 'Free plan · 1 wedding, up to 50 guests' : `${profile?.plan} plan`}
            </p>
          </div>
          <NewWeddingButton currentCount={weddings?.length ?? 0} plan={profile?.plan ?? 'free'} />
        </div>

        {(!weddings || weddings.length === 0) ? (
          <EmptyState />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weddings.map(w => (
              <WeddingCard key={w.id} wedding={w} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function NewWeddingButton({ currentCount, plan }: { currentCount: number; plan: string }) {
  const canCreate = plan !== 'free' || currentCount === 0;
  if (!canCreate) {
    return (
      <Link href="/app/upgrade" className="px-4 py-2 bg-[#FDF4EC] border border-[#EDD5BC] text-[#C9956E] text-sm font-medium rounded-lg hover:bg-[#FDE8D0] transition-colors">
        ✨ Upgrade to add more
      </Link>
    );
  }
  return (
    <Link href="/app/new" className="px-4 py-2 bg-[#C9956E] hover:bg-[#B8845D] text-white text-sm font-semibold rounded-lg transition-colors">
      + New Wedding
    </Link>
  );
}

function WeddingCard({ wedding }: { wedding: any }) {
  return (
    <Link href={`/app/wedding/${wedding.id}`} className="group block bg-white border border-[#EDE8E0] rounded-2xl p-6 hover:border-[#C9956E] hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-[#FDF4EC] rounded-xl flex items-center justify-center text-xl">💍</div>
        <span className="text-xs text-[#9B9098]">{wedding.date ? new Date(wedding.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Date TBD'}</span>
      </div>
      <h3 className="font-playfair font-semibold text-[#2A2328] text-lg mb-1 group-hover:text-[#C9956E] transition-colors">{wedding.name}</h3>
      {wedding.couple_names && <p className="text-sm text-[#6B6068]">{wedding.couple_names}</p>}
      <div className="mt-4 pt-4 border-t border-[#EDE8E0] flex items-center gap-2 text-xs text-[#9B9098]">
        <span>Open planner →</span>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">💍</div>
      <h2 className="font-playfair text-2xl font-bold text-[#2A2328] mb-2">Plan your perfect day</h2>
      <p className="text-[#6B6068] mb-8 max-w-sm mx-auto">Create your first wedding to start building your seating chart.</p>
      <Link href="/app/new" className="inline-block px-6 py-3 bg-[#C9956E] hover:bg-[#B8845D] text-white font-semibold rounded-xl transition-colors">
        Create Your Wedding
      </Link>
    </div>
  );
}
