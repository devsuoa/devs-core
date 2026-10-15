import { supabase } from "./supabase";

type LoginParams = {
  email: string;
  password: string;
  setError: (error: string) => void;
  setLoading: (loading: boolean) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  navigate: (path: string) => void;
};

export async function handleLoginSubmit(
  e: React.FormEvent,
  { email, password, setError, setLoading, setEmail, setPassword, navigate }: LoginParams,
): Promise<void> {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      throw new Error("Invalid email or password");
    }

    // Check if profile exists, create it if it doesn't
    let profile = await supabase
      .from("profiles")
      .select("role, username")
      .eq("id", data.user.id)
      .single();

    if (profile.error) {
      // Profile doesn't exist - create it
      // Get username from user metadata if available
      const username =
        (data.user.user_metadata?.username as string) || data.user.email?.split("@")[0] || "";

      const { error: createError } = await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          username: username,
        },
        {
          onConflict: "id",
        },
      );

      if (createError) {
        console.error("Failed to create profile:", createError);
        throw new Error("Failed to create user profile. Please contact support.");
      }

      const profileResponse = await supabase
        .from("profiles")
        .select("role, username")
        .eq("id", data.user.id)
        .single();

      if (profileResponse.error) {
        throw new Error("Failed to verify user role");
      }

      profile = profileResponse;
    }

    // Validate user roles
    if (!profile.data) {
      throw new Error("Failed to verify user role");
    }

    if (profile.data.role !== "admin") {
      await supabase.auth.signOut();
      throw new Error("You do not have access");
    }

    // On success clear fields
    setEmail("");
    setPassword("");

    navigate("/admin/dashboard");
    console.log("Admin login successful");
  } catch (err) {
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Something went wrong");
    }
  } finally {
    setLoading(false);
  }
}
