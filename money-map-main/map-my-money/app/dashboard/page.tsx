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

  return (
    <div>
      <h1>Your Dashboard</h1>
      <GraphEditor />
    </div>
  );
}
