import React, { useState } from 'react';
import { handleSignupSubmit } from '../../lib/signup';
import Header from '../../components/Header';
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
        image="/theme/title_icon.png"
        title="Admin Signup"
        className='mt-[5vh]'
      />
      <div className="flex items-center justify-center mt-[10vh] px-4 py-12">
      <div className="w-[50vw] max-w-[900px] min-w-[650px]">
        <div className="pixel-panel font-pixelify relative" style={{ padding: '48px 40px' }}>
          {success && (
            <div className="mb-[5vh] p-4 font-pixelify text-green-400 text-xs">
              Signup successful! Please check your email to confirm your account.
            </div>
          )}

          {error && (
            <div className="mb-[5vh] p-4 font-pixelify text-red-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2" style={{ columnGap: '80px', marginBottom: '56px' }}>
              <div>
                <label htmlFor="username" className="pixel-label font-pixelify block" style={{ marginBottom: '16px' }}>
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
                <label htmlFor="email" className="pixel-label font-pixelify block" style={{ marginBottom: '16px' }}>
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

            <div className="grid grid-cols-2" style={{ columnGap: '80px', marginBottom: '40px' }}>
              <div>
                <label htmlFor="password" className="pixel-label font-pixelify block" style={{ marginBottom: '16px' }}>
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
                <label htmlFor="confirmPassword" className="pixel-label font-pixelify block" style={{ marginBottom: '16px' }}>
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

            <div className="flex justify-start mt-8">
              <button
                type="submit"
                disabled={loading}
                className="pixel-button font-silkscreen"
              >
                {loading ? 'Signing up...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </>
  );
};

export default AdminSignup;

