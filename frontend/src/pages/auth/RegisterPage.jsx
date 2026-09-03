import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { User, Mail, Lock, Building, ArrowRight } from 'lucide-react';
import { USER_ROLES } from '../../utils/constants';

export function RegisterPage() {
  const { register } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    organization: '',
    role: USER_ROLES.APPLICANT,
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Please fill in all mandatory fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register(form);
      showSuccess('Account registered successfully! Welcome to BizClear AI.', 'Account Created');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
      showError(err.message || 'Registration failed', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl">Create Enterprise Account</CardTitle>
          <CardDescription>
            Join BizClear AI to manage statutory clearances and compliance intelligence.
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
              label="Full Name"
              placeholder="e.g. Authorized Signatory Name"
              leftIcon={User}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <Input
              label="Work Email"
              type="email"
              placeholder="name@company.com"
              leftIcon={Mail}
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <Input
              label="Company / Enterprise Name"
              placeholder="e.g. Enterprise Legal Entity"
              leftIcon={Building}
              value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })}
            />

            <Select
              label="Account Role"
              options={[
                { value: USER_ROLES.APPLICANT, label: 'Enterprise Applicant / Owner' },
                { value: USER_ROLES.OFFICER, label: 'Departmental Compliance Officer' },
              ]}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                leftIcon={Lock}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                leftIcon={Lock}
                required
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
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
              Create Account
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-[#E2E8E7] py-4">
          <p className="text-xs text-[#66757A]">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-[#006B68] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
