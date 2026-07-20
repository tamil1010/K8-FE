import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, User, Lock, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Small simulated delay for authentication feel
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const success = login(username, password);
      if (success) {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded border border-gray-200 shadow-md p-8 relative overflow-hidden">
        {/* Kubernetes Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-k8s-blue"></div>

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-k8s-lightBlue rounded-full text-k8s-blue mb-4">
            <svg className="w-12 h-12" viewBox="0 0 256 250" fill="currentColor">
              <path d="M128 0L23.7 34.3l15.9 123.4 88.4 92.3 88.4-92.3 15.9-123.4L128 0zm0 30l81.6 26.8-12.4 96.6-69.2 72.3-69.2-72.3-12.4-96.6L128 30z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Kubernetes Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Authenticate to access cluster resources</p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-800">Authentication Failed</h4>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Credentials Tip */}
        <div className="bg-blue-50 border-l-4 border-k8s-blue p-3.5 mb-6 rounded text-xs text-blue-800 space-y-1">
          <p className="font-semibold">💡 Local Development Credentials:</p>
          <p>Username: <span className="font-mono bg-blue-100/70 px-1 rounded text-blue-900">admin</span></p>
          <p>Password: <span className="font-mono bg-blue-100/70 px-1 rounded text-blue-900">admin123</span></p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter cluster username"
                className="w-full border border-gray-300 rounded py-2 pl-10 pr-3 text-sm focus:outline-none focus:border-k8s-blue focus:ring-1 focus:ring-k8s-blue text-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded py-2 pl-10 pr-3 text-sm focus:outline-none focus:border-k8s-blue focus:ring-1 focus:ring-k8s-blue text-gray-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 text-sm font-semibold rounded text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-k8s-blue
              ${loading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-k8s-blue hover:bg-blue-600 active:bg-blue-700'
              }`}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
