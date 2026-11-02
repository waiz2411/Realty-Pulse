import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import api from '../../lib/api';
import type { Lead, LeadStatus } from '../../types';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, Calendar } from 'lucide-react';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onSuccess: (updatedLead: Lead) => void;
}

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'site_visit_scheduled', label: 'Site Visit Scheduled' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  lead,
  onSuccess,
}) => {
  const [nextDate, setNextDate] = useState('');
  const [status, setStatus] = useState<LeadStatus>('contacted');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (lead) {
      setStatus(lead.status);
      setNextDate('');
      setNote('');
    }
  }, [lead, isOpen]);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post(`/agent/leads/${lead.id}/complete-followup`, {
        next_follow_up_date: nextDate || null,
        status: status,
        note: note || undefined,
      });

      toast.success('Follow-up recorded successfully');
      onSuccess(response.data.lead);
      onClose();
    } catch {
      toast.error('Failed to update follow-up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Follow-up"
      description={`Log follow-up result for ${lead.name}`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Update Lead Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Schedule Next Follow-up (Optional)
          </label>
          <input
            type="date"
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Leave blank if no further follow-up is scheduled.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Follow-up Outcome Note
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Spoke with client, confirmed interest in 2-bed unit..."
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>Save & Complete</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
