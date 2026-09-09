import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function Login({ initialMode = 'create' }) {
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
      if (!username.trim() || !email.trim() || !password || !confirmPassword) {
        setError('Please fill in all fields.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      try {
        setLoading(true);

        await base44.entities.User.create({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password: password,
          role: 'user'
        });

        setLoading(false);
        alert('Account created successfully! Click "Sign in" to log in.');
        setMode('signin');
      } catch (err) {
        console.error('Sign up error:', err);
        setLoading(false);
        setError(err.message || 'Failed to create account.');
      }
    } else {
      try {
        setLoading(true);
        // Use standard Base44 login redirect
        base44.auth.redirectToLogin(window.location.href);
      } catch (err) {
        console.error('Sign in error:', err);
        setLoading(false);
        setError(err.message || 'Failed to start sign in.');
      }
    }
  };

  const inputStyle = {
    color: '#000000',
    backgroundColor: '#ffffff',
    colorScheme: 'light'
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
              ? 'Pick a unique username and a real email to get started.'
              : 'Sign in to access your account'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError('');
            }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              mode === 'signin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('create');
              setError('');
            }}
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
                style={inputStyle}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Email
            </label>
            <input
              type="email"
              required={mode === 'create'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="bob@gmail.com"
              style={inputStyle}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Password
            </label>
            <input
              type="password"
              required={mode === 'create'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
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
                style={inputStyle}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
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
