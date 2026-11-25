import { supabase } from "./supabase";
import { fetchMe } from "./api";
import { devSignIn } from "./devLogin";
import { handleLogout } from "./auth";

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
    // Under pnpm dev, the seeded local accounts log in without Supabase (see devLogin.ts).
    const devAccount = import.meta.env.DEV && (await devSignIn(email, password));
    if (!devAccount) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        throw new Error("Invalid email or password");
      }
    }

    // Exec access is decided by the API from the database, not by anything the browser can set.
    const me = await fetchMe();
    if (me.role !== "admin") {
      await handleLogout();
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
