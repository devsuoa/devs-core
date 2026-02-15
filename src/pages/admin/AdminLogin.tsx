import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleLoginSubmit } from '../../lib/login';
import Header from '../../components/Header';
import { PageTitle } from '../../components/PageTitle';
import Footer from '../../components/Footer';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

  return (
    <>
      <Header />
      <PageTitle
        image="/theme/title_icon.png"
        title="Admin Login"
        className='mt-[5vh]'
      />
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

              <div className="flex justify-start mt-6 sm:mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="pixel-button font-silkscreen min-h-[44px] min-w-[120px] touch-manipulation"
                >
                  {loading ? 'Logging in...' : 'Submit'}
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

export default AdminLogin;

