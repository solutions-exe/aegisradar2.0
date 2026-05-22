'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('role', data.role);
        router.push('/dashboard');
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="bg-[#1a1a1a] border border-[#00ff46]/30 p-10 rounded-xl w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[#00ff46]">AEGIS</h1>
          <p className="text-gray-400 mt-2">SYSTEM ACCESS TERMINAL</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm mb-2 text-gray-400">USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black border border-gray-600 p-4 text-white focus:border-[#00ff46] outline-none font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-gray-400">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-gray-600 p-4 text-white focus:border-[#00ff46] outline-none font-mono"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00ff46] hover:bg-[#00cc38] text-black font-bold py-4 transition-all disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'LOGIN TO SYSTEM'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-8">
          Demo Mode • Faculty Presentation
        </p>
      </div>
    </div>
  );
}
