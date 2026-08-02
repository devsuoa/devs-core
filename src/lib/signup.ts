import { supabase } from "./supabase";

interface SignupParams {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  setError: (error: string) => void;
  setSuccess: (success: boolean) => void;
  setLoading: (loading: boolean) => void;
  setUsername: (username: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setConfirmPassword: (confirmPassword: string) => void;
}

const verifyEmailExists = async (email: string): Promise<boolean | null> => {
  try {
    const domain = email.split("@")[1];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // timeout after3 seconds

    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json();

      // Check if email is valid
      return data.Answer && data.Answer.length > 0;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.warn("Email domain MX lookup timed out");
      } else {
        console.warn("Email domain MX lookup failed:", fetchError);
      }
      return null; // Return null to indicate check failed but non-blocking
    }
  } catch (error) {
    console.warn("Email verification error:", error);
    return null;
  }
};

export const handleSignupSubmit = async (
  e: React.FormEvent,
  {
    username,
    email,
    password,
    confirmPassword,
    setError,
    setSuccess,
    setLoading,
    setUsername,
    setEmail,
    setPassword,
    setConfirmPassword,
  }: SignupParams,
): Promise<void> => {
  e.preventDefault();
  setError("");
  setSuccess(false);

  // Validate username
  if (!username || username.trim().length === 0) {
    setError("Please enter your name");
    return;
  }

  // Validate passwords match
  if (password !== confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  // Validate password length
  if (password.length < 6) {
    setError("Password must be at least 6 characters long");
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    setError("Please enter a valid email address");
    return;
  }

  setLoading(true);

  // Validate email domain exists (non-blocking check with timeout)
  const emailExists = await verifyEmailExists(email);
  if (emailExists === false) {
    // Block if email doesnt exist
    setError("This email domain does not exist or cannot receive emails");
    setLoading(false);
    return;
  }

  try {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data && data.user) {
      // Check if user has an active session (they might be auto-signed in)
      const sessionFromSignup = data.session?.user?.id === data.user.id;
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionFromAuth = sessionData?.session?.user?.id === data.user.id;
      const hasActiveSession = sessionFromSignup || sessionFromAuth;

      if (hasActiveSession) {
        // User is signed in, we can create/update the profile
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            username: username.trim(),
          },
          {
            onConflict: "id",
          },
        );

        if (profileError) {
          console.error("Profile upsert error:", profileError);

          // Sign out the user to prevent partial state
          try {
            await supabase.auth.signOut();
          } catch (cleanupErr) {
            console.error("Error during cleanup:", cleanupErr);
          }

          setError(
            `Account creation incomplete: Failed to save profile (${profileError.message}). ` +
              `Your email account was created but the profile could not be saved. ` +
              `Please try signing in with your email and password - your profile will be created automatically. ` +
              `If issues persist, please contact support.`,
          );
          setLoading(false);
          return;
        }
      } else {
        // No active session, profile will be created by database trigger or on first login
        // This is normal if email confirmation is required
        console.log(
          "No active session after signup - profile will be created on first login or via database trigger",
        );
      }

      setSuccess(true);
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    }
  } catch (err) {
    setError("An unexpected error occurred. Please try again.");
    console.error("Signup error:", err);
  } finally {
    setLoading(false);
  }
};
