import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { StatusBadge } from '../common/StatusBadge';
import { clsx } from 'clsx';

export function FileDropzone({
  document,
  onUpload,
  onVerify,
  uploading = false,
  verifying = false,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onUpload(document.id, files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(document.id, files[0]);
    }
  };

  const isUploaded = document.status === 'Uploaded' || !!document.file_path;
  const isVerified = document.status === 'Verified';

  return (
    <div className="p-4 rounded-xl border border-[#E2E8E7] bg-white shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-[#172126]">
              {document.document_name}
            </h4>
            {document.required && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#FCEEEE] text-[#C93D3D]">
                Mandatory
              </span>
            )}
          </div>
          <p className="text-xs text-[#66757A] capitalize">
            Type: {document.document_type || 'Certificate / Form'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <StatusBadge status={document.status} />
        </div>
      </div>

      {/* Upload Zone / Uploaded File Banner */}
      {!isUploaded ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={clsx(
            'flex flex-col items-center justify-center p-5 rounded-lg border-2 border-dashed transition-colors cursor-pointer text-center',
            isDragging
              ? 'border-[#006B68] bg-[#E6F2F2]'
              : 'border-[#E2E8E7] bg-[#F8FAF9] hover:bg-[#F0F7F6]'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />

          {uploading ? (
            <div className="flex items-center gap-2 text-[#006B68]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs font-semibold">Uploading document to server...</span>
            </div>
          ) : (
            <>
              <UploadCloud className="w-7 h-7 text-[#66757A] mb-1.5" />
              <p className="text-xs font-medium text-[#172126]">
                Drag & drop document here, or <span className="text-[#006B68] underline">browse</span>
              </p>
              <p className="text-[11px] text-[#66757A] mt-0.5">
                PDF, PNG, JPG, or DOCX (Max 25MB)
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-[#F8FAF9] border border-[#E2E8E7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-[#E6F2F2] text-[#006B68] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#172126] truncate">
                {document.file_path ? document.file_path.split(/[\\/]/).pop() : 'Uploaded Document'}
              </p>
              <p className="text-[11px] text-[#66757A]">
                Stored in server repository
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading || verifying}
            />
            <Button
              size="xs"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || verifying}
            >
              Replace
            </Button>

            {onVerify && (
              <Button
                size="xs"
                variant={isVerified ? 'success' : 'primary'}
                icon={Sparkles}
                loading={verifying}
                disabled={uploading || verifying}
                onClick={() => onVerify(document.id)}
              >
                {isVerified ? 'Re-Verify AI' : 'Run AI Verification'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Verification Notes & AI Explanation */}
      {document.verification_notes && (
        <div
          className={clsx(
            'p-3 rounded-lg text-xs space-y-1 border',
            isVerified
              ? 'bg-[#E8F6F1] text-[#0C6148] border-[#C2EAD9]'
              : 'bg-[#FCEEEE] text-[#C93D3D] border-[#F8CDCD]'
          )}
        >
          <div className="flex items-center gap-1.5 font-semibold">
            {isVerified ? (
              <CheckCircle2 className="w-4 h-4 text-[#159A72]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#E05252]" />
            )}
            <span>AI Verification Result: {isVerified ? 'Compliant' : 'Non-Compliant / Rejected'}</span>
          </div>
          <p className="text-[11px] leading-relaxed pl-5">
            {document.verification_notes}
          </p>
        </div>
      )}
    </div>
  );
}
