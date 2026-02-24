import React, { useState } from 'react';
import { handleSignupSubmit } from '../../lib/signup';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { PageTitle } from '../../components/PageTitle';

const AdminSignup: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    handleSignupSubmit(e, {
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
    });
  };

  return (
    <>
      <Header />
      <PageTitle
        title="Admin Signup"
        className='mt-[5vh]'
      />
      <div className="flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full sm:max-w-[90%] md:max-w-[75%] lg:w-[50vw] lg:max-w-[900px]">
        <div className="pixel-panel font-pixelify relative p-6 sm:p-8 md:p-10 lg:px-10 lg:py-12">
          {success && (
            <div className="mb-6 sm:mb-[5vh] p-3 sm:p-4 font-pixelify text-green-400 text-xs">
              Signup successful! Please check your email to confirm your account.
            </div>
          )}

          {error && (
            <div className="mb-6 sm:mb-[5vh] p-3 sm:p-4 font-pixelify text-red-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-14 lg:gap-20 mb-8 sm:mb-12 lg:mb-14">
              <div>
                <label htmlFor="username" className="pixel-label font-pixelify block mb-4">
                  name<span className="text-red-400">*</span>
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pixel-input font-pixelify w-full"
                  placeholder="Enter Name"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="email" className="pixel-label font-pixelify block mb-4">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-14 lg:gap-20 mb-6 sm:mb-10">
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

              <div>
                <label htmlFor="confirmPassword" className="pixel-label font-pixelify block mb-4">
                  confirm password<span className="text-red-400">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pixel-input font-pixelify w-full"
                  placeholder="Confirm password"
                  required
                  disabled={loading}
                  minLength={6}
                />
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="mt-3 font-pixelify text-red-400 text-xs">Passwords do not match</p>
                )}
              </div>
            </div>

            <div className="flex justify-start mt-6 sm:mt-8">
              <button
                type="submit"
                disabled={loading}
                className="pixel-button font-silkscreen min-h-[44px] min-w-[120px] touch-manipulation"
              >
                {loading ? 'Signing up...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
};

export default AdminSignup;

