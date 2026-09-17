import React, { useState } from 'react';
import { ExternalLink, ShieldCheck, CheckCircle2, AlertTriangle, Send, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';

export function GovernmentSubmissionModal({
  isOpen,
  onClose,
  onSubmit,
  submitting,
  application,
  approval,
  business,
}) {
  const [governmentAppId, setGovernmentAppId] = useState('');
  const [portalAcknowledged, setPortalAcknowledged] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const portalUrl = application?.portal_submission_url || approval?.application_url || 'https://udyamregistration.gov.in/';
  const authorityName = approval?.authority || 'Government Authority';
  const approvalName = approval?.approval_name || approval?.name || 'Regulatory Clearance';

  const handleLaunchPortal = () => {
    window.open(portalUrl, '_blank', 'noopener,noreferrer');
    setPortalAcknowledged(true);
  };

  const handleCopySummary = () => {
    const summary = `Enterprise: ${business?.name}\nPermit: ${approvalName}\nAuthority: ${authorityName}\nPAN: ${business?.pan || 'As provided in profile'}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConfirmSubmit = () => {
    onSubmit({
      government_app_id: governmentAppId.trim(),
      reference_no: governmentAppId.trim(),
      portal_acknowledged: portalAcknowledged,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172126]/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#E2E8E7] shadow-xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#E2E8E7] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#E8F6F1] text-[#006B68] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[#172126]">
                Authoritative Government Filing
              </h2>
            </div>
            <p className="text-xs text-[#66757A]">
              Direct submission to <strong>{authorityName}</strong> for <strong>{approvalName}</strong>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#66757A] hover:text-[#172126] p-1 rounded-lg text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Notice */}
        <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#E2E8E7] text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-[#172126]">
            <CheckCircle2 className="w-4 h-4 text-[#159A72]" />
            <span>Statutory Verification Complete</span>
          </div>
          <p className="text-[#66757A] leading-relaxed">
            All mandatory enterprise disclosures, PAN details, financial declarations, and statutory documents have been validated according to departmental regulations.
          </p>
        </div>

        {/* Government Portal Interaction */}
        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-[#006B68]/30 bg-[#E6F2F2]/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#003F3D]">Official Filing Gateway:</p>
                <p className="text-[11px] text-[#004F4D] font-mono break-all">{portalUrl}</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={ExternalLink}
                iconPosition="right"
                onClick={handleLaunchPortal}
              >
                Open Portal
              </Button>
            </div>
            <p className="text-[11px] text-[#004F4D]">
              Launch the official department portal to finalize Aadhaar OTP / DSC e-Sign authorization.
            </p>
          </div>

          {/* Reference Number Input */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-bold text-[#172126]">
              Government Application / Reference Number (ARN / Ack No)
            </label>
            <p className="text-[11px] text-[#66757A]">
              Enter the exact official identifier provided on the department acknowledgment receipt.
            </p>
            <input
              type="text"
              placeholder="e.g. UDYAM-TN-02-0012345 or AA3309240012345"
              value={governmentAppId}
              onChange={(e) => setGovernmentAppId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-mono uppercase rounded-lg border border-[#E2E8E7] focus:border-[#006B68] focus:ring-2 focus:ring-[#006B68]/15"
            />
            <div className="flex items-center gap-1.5 text-[11px] text-[#66757A] pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#006B68]" />
              <span>BizClear records only authoritative government reference numbers.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8E7]">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Send}
            iconPosition="right"
            loading={submitting}
            disabled={!governmentAppId.trim()}
            onClick={handleConfirmSubmit}
          >
            Confirm & Record Government Submission
          </Button>
        </div>
      </div>
    </div>
  );
}
