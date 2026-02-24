import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { handlePasswordUpdate } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import Header from "../../components/Header";
import { PageTitle } from "../../components/PageTitle";
import Footer from "../../components/Footer";

const AdminResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session) {
          setError(
            "Invalid or expired reset link. Please request a new password reset.",
          );
          setChecking(false);
          return;
        }

        setValidSession(true);
        setChecking(false);
      } catch (err) {
        console.error("Session check error:", err);
        setError("Failed to verify reset link. Please try again.");
        setChecking(false);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    const result = await handlePasswordUpdate(newPassword);

    if (result.success) {
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/admin/login");
      }, 3000);
    } else {
      setError(result.error || "Failed to update password");
    }

    setLoading(false);
  };

  if (checking) {
    return (
      <>
        <Header />
        <PageTitle
          title="Reset Password"
          className="mt-[5vh]"
        />
        <div className="flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
          <div className="w-full sm:max-w-[90%] md:max-w-[75%] lg:w-[50vw] lg:max-w-[900px]">
            <div className="pixel-panel font-pixelify relative p-6 sm:p-8 md:p-10 lg:px-10 lg:py-12">
              <p className="font-pixelify text-white text-center">
                Verifying reset link...
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!validSession) {
    return (
      <>
        <Header />
        <PageTitle
          title="Reset Password"
          className="mt-[5vh]"
        />
        <div className="flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
          <div className="w-full sm:max-w-[90%] md:max-w-[75%] lg:w-[50vw] lg:max-w-[900px]">
            <div className="pixel-panel font-pixelify relative p-6 sm:p-8 md:p-10 lg:px-10 lg:py-12">
              <div className="mb-6 p-4 font-pixelify text-red-400 text-sm">
                {error}
              </div>
              <button
                onClick={() => navigate("/admin/login")}
                className="pixel-button font-silkscreen min-h-[44px] min-w-[120px] touch-manipulation"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <PageTitle
        title="Reset Password"
        className="mt-[5vh]"
      />
      <div className="flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full sm:max-w-[90%] md:max-w-[75%] lg:w-[50vw] lg:max-w-[900px]">
          <div className="pixel-panel font-pixelify relative p-6 sm:p-8 md:p-10 lg:px-10 lg:py-12">
            {success && (
              <div className="mb-6 p-4 font-pixelify text-green-400 text-sm">
                Password updated successfully! Redirecting to login...
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 font-pixelify text-red-400 text-xs">
                {error}
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-14 lg:gap-20 mb-8 sm:mb-12 lg:mb-14">
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="font-pixelify block mb-4"
                    >
                      new password<span className="text-red-400">*</span>
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pixel-input font-pixelify w-full"
                      placeholder="Enter new password"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="pixel-label font-pixelify block mb-4"
                    >
                      confirm password<span className="text-red-400">*</span>
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pixel-input font-pixelify w-full"
                      placeholder="Confirm new password"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="flex justify-start mt-6 sm:mt-8">
                  <button
                    type="submit"
                    disabled={loading}
                    className="pixel-button font-silkscreen min-h-[44px] min-w-[120px] touch-manipulation"
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AdminResetPassword;
