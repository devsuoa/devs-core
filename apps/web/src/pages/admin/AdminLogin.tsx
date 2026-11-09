import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleLoginSubmit } from "../../lib/login";
import { handlePasswordReset } from "../../lib/auth";
import Header from "../../components/Header";
import { PageTitle } from "../../components/PageTitle";
import Footer from "../../components/Footer";

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    handleLoginSubmit(e, {
      email,
      password,
      setError,
      setLoading,
      setEmail,
      setPassword,
      navigate,
    });
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess(false);
    setResetLoading(true);

    const result = await handlePasswordReset(resetEmail);

    if (result.success) {
      setResetSuccess(true);
      setResetEmail("");
    } else {
      setResetError(result.error || "Failed to send reset email");
    }

    setResetLoading(false);
  };

  const openResetModal = () => {
    setShowResetModal(true);
    setResetError("");
    setResetSuccess(false);
    setResetEmail(email); // Pre-fill with login email if available
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetError("");
    setResetSuccess(false);
    setResetEmail("");
  };

  return (
    <>
      <Header />
      <PageTitle title="Admin Login" className="mt-[5vh]" />
      <div className="flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full sm:max-w-[90%] md:max-w-[75%] lg:w-[50vw] lg:max-w-[900px]">
          <div className="pixel-panel font-pixelify relative p-6 sm:p-8 md:p-10 lg:px-10 lg:py-12">
            {error && (
              <div className="mb-6 sm:mb-[5vh] p-3 sm:p-4 font-pixelify text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-14 lg:gap-20 mb-8 sm:mb-12 lg:mb-14">
                <div>
                  <label htmlFor="email" className="font-pixelify block mb-4">
                    email address<span className="text-red-400">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pixel-input font-pixelify w-full"
                    placeholder="admin@devsuoa.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="pixel-label font-pixelify block mb-4">
                    password<span className="text-red-400">*</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pixel-input font-pixelify w-full"
                    placeholder="Enter password"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>
              </div>

              <div className="flex justify-start mt-4">
                <button
                  type="button"
                  onClick={openResetModal}
                  disabled={loading}
                  className="font-pixelify text-sm text-blue-400 hover:text-blue-300 underline"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="flex justify-start mt-6 sm:mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="pixel-button font-silkscreen min-h-[44px] min-w-[120px] touch-manipulation"
                >
                  {loading ? "Logging in..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center px-4 z-50">
          <div className="w-full sm:max-w-[90%] md:max-w-[500px]">
            <div className="pixel-panel font-pixelify relative p-6 sm:p-8">
              <h2 className="font-silkscreen text-xl mb-6">Reset Password</h2>

              {resetSuccess ? (
                <div className="mb-6 p-4 font-pixelify text-green-400 text-sm">
                  Password reset email sent! Check your inbox for instructions to reset your
                  password.
                </div>
              ) : (
                <>
                  {resetError && (
                    <div className="mb-6 p-4 font-pixelify text-red-400 text-xs">{resetError}</div>
                  )}

                  <form onSubmit={handleResetSubmit}>
                    <div className="mb-6">
                      <label htmlFor="resetEmail" className="font-pixelify block mb-4">
                        Enter your email address
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="resetEmail"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="pixel-input font-pixelify w-full"
                        placeholder="admin@devsuoa.com"
                        required
                        disabled={resetLoading}
                      />
                      <p className="font-pixelify text-xs text-gray-400 mt-2">
                        We'll send you an email with a link to reset your password.
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="pixel-button font-silkscreen min-h-[44px] min-w-[120px] touch-manipulation"
                      >
                        {resetLoading ? "Sending..." : "Send Reset Link"}
                      </button>
                      <button
                        type="button"
                        onClick={closeResetModal}
                        disabled={resetLoading}
                        className="pixel-button font-silkscreen min-h-[44px] min-w-[120px] touch-manipulation"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </>
              )}

              {resetSuccess && (
                <div className="flex justify-start mt-6">
                  <button
                    onClick={closeResetModal}
                    className="pixel-button font-silkscreen min-h-[44px] min-w-[120px] touch-manipulation"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default AdminLogin;
