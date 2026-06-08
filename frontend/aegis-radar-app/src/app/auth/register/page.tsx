'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { persistAuth, registerUser } from '@/lib/auth';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Analyst',
    organization_name: '',
    industry: 'ecommerce',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const auth = await registerUser(formData);
      persistAuth(auth);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="bg-[#1a1a1a] border border-[#00ff46]/30 p-10 rounded-xl w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[#00ff46]">AEGIS</h1>
          <p className="text-gray-400 mt-2">NEW USER REGISTRATION</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-sm mb-2 text-gray-400">FULL NAME</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-black border border-gray-600 p-4 text-white focus:border-[#00ff46] outline-none font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-gray-400">EMAIL</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-black border border-gray-600 p-4 text-white focus:border-[#00ff46] outline-none font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-gray-400">PASSWORD</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-black border border-gray-600 p-4 text-white focus:border-[#00ff46] outline-none font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-gray-400">ORGANIZATION NAME</label>
            <input
              type="text"
              value={formData.organization_name}
              onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
              className="w-full bg-black border border-gray-600 p-4 text-white focus:border-[#00ff46] outline-none font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-gray-400">INDUSTRY</label>
            <input
              type="text"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full bg-black border border-gray-600 p-4 text-white focus:border-[#00ff46] outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-gray-400">ROLE</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-black border border-gray-600 p-4 text-white focus:border-[#00ff46] outline-none font-mono"
            >
              <option value="Analyst">Analyst</option>
              <option value="Admin">Admin</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00ff46] hover:bg-[#00cc38] text-black font-bold py-4 transition-all disabled:opacity-50"
          >
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#00ff46] hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
