import React from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  ShieldAlert,
  Eye,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export function OfficerPortalPage() {
  const { businesses, selectBusiness } = useBusiness();
  const { user, role } = useAuth();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-xl bg-[#003F3D] text-white shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#004F4D] text-[#80BFBD] text-xs font-semibold mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            {role.toUpperCase()} Regulatory Audit Console
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Regulatory Oversight & Compliance Audits
          </h1>
          <p className="text-xs text-[#BFE0DF]">
            Authenticated Officer: <span className="font-semibold text-white">{user?.name || 'Officer'}</span> {user?.organization ? `(${user.organization})` : ''}
          </p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 space-y-1">
          <span className="text-xs text-[#66757A] font-medium">Audited Enterprises</span>
          <p className="text-2xl font-bold text-[#172126]">
            {businesses.length}
          </p>
        </Card>
        <Card className="p-4 space-y-1">
          <span className="text-xs text-[#66757A] font-medium">Clearance System</span>
          <p className="text-2xl font-bold text-[#159A72]">
            Online
          </p>
        </Card>
        <Card className="p-4 space-y-1">
          <span className="text-xs text-[#66757A] font-medium">AI Inspection Engine</span>
          <p className="text-2xl font-bold text-[#006B68]">
            Gemini 3.6 Flash
          </p>
        </Card>
      </div>

      {/* Enterprise Audit Registry */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle>Enterprise Clearance Registry</CardTitle>
          <CardDescription>
            Inspect and review statutory dossiers submitted by registered entities.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8E7] bg-[#F8FAF9] text-[#66757A]">
                  <th className="py-3 px-4 font-semibold">Entity ID</th>
                  <th className="py-3 px-4 font-semibold">Enterprise Name</th>
                  <th className="py-3 px-4 font-semibold">Industry Sector</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">Capital</th>
                  <th className="py-3 px-4 font-semibold">Pollution Class</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8E7]">
                {businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F8FAF9] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-[#66757A]">#{b.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-[#172126]">
                      {b.name}
                    </td>
                    <td className="py-3.5 px-4 text-[#172126]">{b.industry}</td>
                    <td className="py-3.5 px-4 text-[#66757A]">{b.location}</td>
                    <td className="py-3.5 px-4 font-semibold text-[#172126]">{formatCurrency(b.investment)}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FEF6E8] text-[#B87707]">
                        {b.pollution_category || 'Orange'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="xs"
                        variant="outline"
                        icon={Eye}
                        onClick={() => {
                          selectBusiness(b);
                          window.location.assign('/approvals');
                        }}
                      >
                        Audit Dossier
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
