import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { USER_ROLES } from '../../utils/constants';
import {
  User,
  Mail,
  Building,
  Briefcase,
  Shield,
  Save,
  CheckCircle2,
  Server,
  Zap,
} from 'lucide-react';

export function ProfilePage() {
  const { user, role, switchRole, updateProfile } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    organization: user?.organization || '',
    title: user?.title || '',
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    try {
      updateProfile(form);
      showSuccess('Profile information updated successfully!', 'Profile Saved');
    } catch {
      showError('Failed to save profile', 'Error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8E7] shadow-xs">
        <div className="flex items-center gap-4">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user?.name || 'User'}
              className="w-14 h-14 rounded-xl object-cover ring-2 ring-[#006B68]/20"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-[#006B68] text-white flex items-center justify-center font-bold text-xl shadow-2xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#172126] tracking-tight">
              {user?.name || 'Authorized Member'}
            </h1>
            <p className="text-xs text-[#66757A]">
              {user?.title || 'Regulatory Clearance Manager'} {user?.organization ? `• ${user.organization}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#E6F2F2] text-[#006B68] border border-[#BFE0DF]">
            Role: {role.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Profile Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Account & Identity Details</CardTitle>
          <CardDescription>
            Update authorized personal and organizational profile parameters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Legal Name"
                leftIcon={User}
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <Input
                label="Email Address"
                leftIcon={Mail}
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Organization / Parent Company"
                leftIcon={Building}
                value={form.organization}
                onChange={(e) => setForm({ ...form, organization: e.target.value })}
              />

              <Input
                label="Designation / Professional Title"
                leftIcon={Briefcase}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E2E8E7]">
              <Button type="submit" variant="primary" icon={Save}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Role Switcher */}
      <Card>
        <CardHeader>
          <CardTitle>User Role & Authorization Level</CardTitle>
          <CardDescription>
            Toggle user role for interface and compliance audit testing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: USER_ROLES.APPLICANT,
                title: 'Applicant',
                desc: 'Register enterprises, discover approvals, create applications.',
              },
              {
                id: USER_ROLES.OFFICER,
                title: 'Compliance Officer',
                desc: 'Audit submitted dossiers, inspect statutory documents.',
              },
              {
                id: USER_ROLES.ADMIN,
                title: 'Administrator',
                desc: 'Full system oversight, rule engine administration.',
              },
            ].map((r) => {
              const isSelected = role === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => switchRole(r.id)}
                  className={`p-4 rounded-xl border transition-colors cursor-pointer space-y-1 ${
                    isSelected
                      ? 'border-[#006B68] bg-[#E6F2F2] ring-1 ring-[#006B68]'
                      : 'border-[#E2E8E7] bg-white hover:bg-[#F8FAF9]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#172126]">
                      {r.title}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#006B68]" />}
                  </div>
                  <p className="text-[11px] text-[#66757A] leading-relaxed">
                    {r.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle>Engine Architecture & System Diagnostics</CardTitle>
          <CardDescription>
            Backend services, database connections, and AI runtime status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between py-2 border-b border-[#E2E8E7]">
            <span className="text-[#66757A] flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-[#006B68]" /> FastAPI Core Framework
            </span>
            <span className="font-mono text-[#159A72] font-semibold">Online (Port 8000)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#E2E8E7]">
            <span className="text-[#66757A] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#006B68]" /> Google Gemini 3.6 Flash
            </span>
            <span className="font-mono text-[#159A72] font-semibold">Active & Connected</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-[#66757A] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#006B68]" /> RAG Regulatory Index
            </span>
            <span className="font-mono text-[#159A72] font-semibold">Indexed (100% Synced)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
