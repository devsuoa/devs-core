import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleLoginSubmit } from '../../lib/login';
import Header from '../../components/Header';
import { PageTitle } from '../../components/PageTitle';

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
        image="/icon_logo.png"
        title="Admin Login"
        className='mt-[5vh]'
      />
      <div className="flex items-center justify-center mt-[10vh] px-4 py-12">
        <div className="w-[50vw] max-w-[900px] min-w-[650px]">
          <div className="pixel-panel relative" style={{ padding: '48px 40px' }}>
            {error && (
              <div className="mb-[5vh] p-4 pixel-text text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2" style={{ columnGap: '80px', marginBottom: '56px' }}>
                <div>
                  <label htmlFor="email" className="pixel-label block" style={{ marginBottom: '16px' }}>
                    email address<span className="text-red-400">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pixel-input w-full"
                    placeholder="admin@devsuoa.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="pixel-label block" style={{ marginBottom: '16px' }}>
                    password<span className="text-red-400">*</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pixel-input w-full"
                    placeholder="Enter password"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>
              </div>

              <div className="flex justify-start mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="pixel-button"
                >
                  {loading ? 'Logging in...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;

