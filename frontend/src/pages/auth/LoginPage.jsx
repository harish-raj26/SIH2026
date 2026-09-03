import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { USER_ROLES } from '../../utils/constants';

export function LoginPage() {
  const { login } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({
    email: '',
    password: '',
    role: USER_ROLES.APPLICANT,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      setError('Please provide email and password');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(form);
      showSuccess('Welcome back to BizClear AI', 'Authentication Successful');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
      showError(err.message || 'Login failed', 'Authentication Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl">Sign in to your account</CardTitle>
          <CardDescription>
            Access your enterprise approvals, statutory roadmaps, and AI assistants.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {error && (
            <div className="p-3 rounded-lg bg-[#FCEEEE] text-[#C93D3D] text-xs font-medium border border-[#F8CDCD]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              leftIcon={Mail}
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-[#172126]">
                  Password <span className="text-[#E05252]">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#006B68] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                leftIcon={Lock}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="md"
              icon={ArrowRight}
              iconPosition="right"
              loading={loading}
            >
              Sign In to Workspace
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-[#E2E8E7] py-4">
          <p className="text-xs text-[#66757A]">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-[#006B68] hover:underline"
            >
              Register here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
