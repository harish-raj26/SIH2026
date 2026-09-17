import React, { useEffect, useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../context/AuthContext';
import { complianceService } from '../../services/complianceService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function CompliancePage() {
  const { activeBusiness } = useBusiness();
  const { isOfficer, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!activeBusiness?.id) return;
    setLoading(true);
    try {
      const [n, i, d] = await Promise.all([
        complianceService.getNotifications(activeBusiness.id),
        complianceService.getInspections(activeBusiness.id),
        complianceService.getDues(activeBusiness.id),
      ]);
      setNotifications(n.notifications || []);
      setInspections(i.inspections || []);
      setDues(d.dues || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [activeBusiness?.id]);

  if (!activeBusiness) return <Card><CardContent className="p-8">Select a business to view compliance lifecycle information.</CardContent></Card>;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-[#172126]">Compliance Lifecycle</h1>
        <p className="text-sm text-[#66757A] mt-1">{activeBusiness.name} — applications, inspections, notifications and recorded dues.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {notifications.length === 0 ? <p className="text-sm text-[#66757A]">No notifications yet.</p> :
              notifications.map(n => <div key={n.id} className="rounded-lg border p-3"><div className="font-semibold text-sm">{n.title}</div><p className="text-xs mt-1">{n.message}</p></div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Inspections</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {inspections.length === 0 ? <p className="text-sm text-[#66757A]">No inspections scheduled.</p> :
              inspections.map(i => <div key={i.id} className="rounded-lg border p-3"><div className="font-semibold text-sm">Application #{i.application_id}</div><p className="text-xs mt-1">{new Date(i.scheduled_at).toLocaleString()}</p><p className="text-xs">{i.inspector || 'Inspector not assigned'}</p></div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Compliance Dues</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {dues.length === 0 ? <p className="text-sm text-[#66757A]">No dues recorded.</p> :
              dues.map(d => <div key={d.id} className="rounded-lg border p-3"><div className="font-semibold text-sm">{d.title}</div><p className="text-xs mt-1">₹{Number(d.amount || 0).toLocaleString('en-IN')} · {d.status}</p>{d.status !== 'Paid' && <Button size="sm" className="mt-2" onClick={async () => { await complianceService.payDue(d.id); load(); }}>Mark Paid</Button>}</div>)}
          </CardContent>
        </Card>
      </div>

      {(isOfficer || isAdmin) && <Card><CardContent className="p-4 text-xs text-[#66757A]">
        Officer/admin tools for scheduling inspections and recording dues are available through the API and Officer Portal. Payment in this prototype only records a paid status; no real payment gateway is connected.
      </CardContent></Card>}

      {loading && <p className="text-xs text-[#66757A]">Refreshing lifecycle data…</p>}
    </div>
  );
}
