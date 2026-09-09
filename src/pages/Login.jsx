import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function Login({ initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'create') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      try {
        setLoading(true);
        // Step 1: Create the User entity in Base44
        await base44.entities.User.create({
          username: username,
          email: email,
          password: password,
          role: 'user'
        });

        // Step 2: Verify step or redirect to login after creation
        setLoading(false);
        alert('Account created successfully! You can now log in.');
        setMode('signin');
      } catch (err) {
        console.error(err);
        setLoading(false);
        setError(err.message || 'Failed to create account.');
      }
    } else {
      try {
        setLoading(true);
        // Use Base44 standard authentication redirect or login method
        base44.auth.redirectToLogin(window.location.href);
      } catch (err) {
        console.error(err);
        setLoading(false);
        setError(err.message || 'Failed to sign in.');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
            🔒
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Create your account.' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {mode === 'create'
              ? 'Pick a unique username and a real email — you’ll confirm it with a quick code.'
              : 'Sign in to access your account'}
          </p>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              mode === 'signin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              mode === 'create' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Create account
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'create' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Bob"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="bob@gmail.com"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>

          {mode === 'create' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black py-2.5 text-sm font-semibold text-white shadow hover:bg-gray-800 disabled:opacity-50"
          >
            {loading
              ? 'Processing...'
              : mode === 'create'
              ? 'Create account ⚡'
              : 'Sign in ⚡'}
          </button>
        </form>
      </div>
    </div>
  );
}
