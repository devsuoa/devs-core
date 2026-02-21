import { supabase } from "./supabase";

export async function checkAdminAuthorization(): Promise<boolean> {
  try {
    // Check if user has active session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return false;
    }

    // Check if user has access
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      await supabase.auth.signOut();
      return false;
    }

    return true;
  } catch (err) {
    console.error("Authorization check failed:", err);
    return false;
  }
}

export async function handleLogout(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Logout failed:", err);
    throw err;
  }
}

export async function handlePasswordReset(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!email || !email.trim()) {
      return { success: false, error: "Please enter your email address" };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Please enter a valid email address" };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    if (error) {
      console.error("Password reset error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Password reset failed:", err);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function handlePasswordUpdate(
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters long",
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("Password update error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Password update failed:", err);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
