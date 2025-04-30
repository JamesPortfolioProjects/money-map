import { supabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';

const GraphEditor = dynamic(() => import('@/app/components/GraphEditor'), { ssr: false });

export default async function DashboardPage() {
  const supabase = supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

export default function HomePage() {
  return (
    <div style={{ padding: '40px' }}>
      <h1>Welcome to Map My Money</h1>
      <p><a href="/auth/login">Log in</a> or <a href="/auth/signup">Sign up</a> to begin mapping your finances.</p>
    </div>
  );
}

