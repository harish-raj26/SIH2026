import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your registered email and we will dispatch recovery instructions.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {submitted ? (
            <div className="p-4 rounded-xl bg-[#E8F6F1] border border-[#C2EAD9] text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#159A72] mx-auto" />
              <h4 className="text-sm font-semibold text-[#172126]">
                Reset Link Dispatched
              </h4>
              <p className="text-xs text-[#66757A]">
                If an account exists for <span className="font-semibold text-[#172126]">{email}</span>, you will receive password reset instructions.
              </p>
              <div className="pt-2">
                <Link to="/reset-password">
                  <Button variant="outline" size="sm" fullWidth>
                    Proceed to Reset Password Page
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@company.com"
                leftIcon={Mail}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="md"
                loading={loading}
              >
                Send Recovery Instructions
              </Button>
            </form>
          )}
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
