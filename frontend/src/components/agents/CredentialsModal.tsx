import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Copy, Check, Key, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  credentials: {
    name?: string;
    email: string;
    password: string;
  } | null;
}

export const CredentialsModal: React.FC<CredentialsModalProps> = ({
  isOpen,
  onClose,
  title = 'Agent Account Credentials',
  credentials,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !credentials) return null;

  const handleCopy = () => {
    const text = `Real Estate CRM Login Credentials:\nEmail: ${credentials.email}\nPassword: ${credentials.password}\nLogin URL: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="Copy these login credentials to securely share with the agent."
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            For security, the password is only displayed right now. It is encrypted in
            the database and cannot be recovered later.
          </p>
        </div>

        <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          {credentials.name && (
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Agent Name:</span>
              <span className="font-semibold text-slate-800">{credentials.name}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-1 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Email / Login ID:</span>
            <span className="font-mono font-medium text-slate-800">{credentials.email}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 font-medium">Temporary Password:</span>
            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {credentials.password}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
