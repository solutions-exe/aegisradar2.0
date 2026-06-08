'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginUser, persistAuth } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const auth = await loginUser({ email, password });
      persistAuth(auth);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in right now.');
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
            <label className="block text-sm mb-2 text-gray-400">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

        <p className="text-center mt-6 text-sm">
          Need an account?{' '}
          <Link href="/auth" className="text-[#00ff46] hover:underline">
            Create one here
          </Link>
        </p>
      </div>
    </div>
  );
}
