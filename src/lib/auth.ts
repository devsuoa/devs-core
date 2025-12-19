import { supabase } from './supabase';

export async function checkAdminAuthorization(): Promise<boolean> {
  try {
    // Check if user has active session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return false;
    }

    // Check if user has access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      await supabase.auth.signOut();
      return false;
    }

    return true;
  } catch (err) {
    console.error('Authorization check failed:', err);
    return false;
  }
}

export async function handleLogout(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Logout failed:', err);
    throw err;
  }
}

