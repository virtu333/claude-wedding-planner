// Force rebuild - password gate component
import { useState, type ReactNode, type FormEvent } from 'react';

const AUTH_KEY = 'wedding-planner-auth';
const PASSWORD = import.meta.env.VITE_APP_PASSWORD;

interface PasswordGateProps {
  children: ReactNode;
}

export function PasswordGate({ children }: PasswordGateProps) {
  const isPasswordEnabled = !!PASSWORD && PASSWORD.trim() !== '';

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (!isPasswordEnabled) return true;
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  });

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // No password configured - render children immediately
  if (!isPasswordEnabled) {
    return <>{children}</>;
  }

  // Already authenticated - render children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password === PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-[#29564F] mb-2">
            Wedding Planner
          </h1>
          <p className="text-gray-500 text-sm">
            Enter password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#29564F] focus:border-transparent"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[#29564F] text-white py-2 px-4 rounded-md hover:bg-[#1e3f3a] transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
