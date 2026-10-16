import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Lock, UserPlus, ArrowRight } from 'lucide-react';
import { toast } from '../components/ui/Toast';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, user, hasProfile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      if (!hasProfile) {
        navigate('/profile/setup', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, hasProfile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError('Please fill out all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please recheck.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      toast.success('Account created! Now setup your student profile.');
      navigate('/profile/setup');
    } catch (err: unknown) {
      let msg = 'Signup failed. Please try again.';
      if (err instanceof Error) {
        msg = err.message;
      } else if (typeof err === 'string') {
        msg = err;
      } else if (err && typeof err === 'object') {
        const anyErr = err as any;
        msg = (typeof anyErr.message === 'string' ? anyErr.message : '') ||
              (typeof anyErr.error_description === 'string' ? anyErr.error_description : '') ||
              (typeof anyErr.error === 'string' ? anyErr.error : '') ||
              'Signup failed. Please try again.';
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      let msg = 'Google sign up failed.';
      if (err instanceof Error) {
        msg = err.message;
      } else if (typeof err === 'string') {
        msg = err;
      }
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-card shadow-card p-6 md:p-8 border border-border">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-btn bg-primary text-white flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-sm">
            CS
          </div>
          <h1 className="text-2xl font-bold text-text">Create Free Account</h1>
          <p className="text-sm text-text-muted mt-1">
            Join CodeSaathi AI to start digitizing and running your code
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-btn bg-error-bg text-error text-xs font-medium border border-error/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            leftIcon={<Lock className="w-4 h-4" />}
            required
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            leftIcon={<Lock className="w-4 h-4" />}
            required
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            fullWidth
            icon={<UserPlus className="w-4 h-4" />}
          >
            Create Account
          </Button>
        </form>

        <div className="my-5 flex items-center">
          <div className="flex-1 border-t border-border" />
          <span className="px-3 text-xs text-text-muted uppercase font-semibold">Or</span>
          <div className="flex-1 border-t border-border" />
        </div>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          fullWidth
          onClick={handleGoogleSignup}
          icon={
            <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          }
        >
          Sign in with Google
        </Button>

        <div className="mt-6 text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
          >
            <span>Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
