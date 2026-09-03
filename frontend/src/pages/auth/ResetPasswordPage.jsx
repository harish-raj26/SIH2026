import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showSuccess } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showSuccess('Password has been successfully updated!', 'Password Reset');
      navigate('/login');
    }, 500);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl">Set New Password</CardTitle>
          <CardDescription>
            Create a secure password with at least 8 characters.
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
              label="New Password"
              type="password"
              placeholder="••••••••"
              leftIcon={Lock}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              leftIcon={Lock}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="md"
              loading={loading}
              icon={ArrowRight}
              iconPosition="right"
            >
              Update Password
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center text-xs text-[#66757A] border-t border-[#E2E8E7] py-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-[#006B68] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
