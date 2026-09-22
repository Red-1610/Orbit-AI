import { redirect } from 'next/navigation';
import { createClient } from '@/lib/db/server';

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? '/workspace' : '/landingpage');
}
