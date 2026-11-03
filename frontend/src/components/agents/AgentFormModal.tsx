import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import api from '../../lib/api';
import type { User, AccountStatus } from '../../types';
import { toast } from 'sonner';
import { Loader2, Sparkles, Calendar, Eye, EyeOff } from 'lucide-react';

interface AgentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: User | null;
  onSuccess: (agent: User, credentials?: { email: string; password: string }) => void;
}

const getDefaultExpiry = (months = 1) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
};

export const AgentFormModal: React.FC<AgentFormModalProps> = ({
  isOpen,
  onClose,
  agent,
  onSuccess,
}) => {
  const isEdit = Boolean(agent);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    account_status: 'active' as AccountStatus,
    subscription_expiry_date: getDefaultExpiry(1),
  });

  const [addDemoData, setAddDemoData] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name || '',
        email: agent.email || '',
        phone: agent.phone || '',
        password: '',
        account_status: agent.account_status || 'active',
        subscription_expiry_date: agent.subscription_expiry_date
          ? agent.subscription_expiry_date.split('T')[0]
          : getDefaultExpiry(1),
      });
      setAddDemoData(false);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        account_status: 'active',
        subscription_expiry_date: getDefaultExpiry(1),
      });
      setAddDemoData(true);
    }
    setShowPassword(false);
    setErrors({});
  }, [agent, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleApplyPreset = (months: number) => {
    setFormData((prev) => ({
      ...prev,
      subscription_expiry_date: getDefaultExpiry(months),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        account_status: formData.account_status,
        subscription_expiry_date: formData.subscription_expiry_date,
        password: formData.password || undefined,
      };

      if (!isEdit) {
        payload.add_demo_data = addDemoData;
      }

      if (isEdit && agent) {
        const res = await api.put(`/admin/agents/${agent.id}`, payload);
        toast.success('Agent updated successfully');
        onSuccess(res.data.agent);
      } else {
        const res = await api.post('/admin/agents', payload);
        const demoMsg = res.data.demo_leads_created
          ? ` (${res.data.demo_leads_created} demo leads added)`
          : '';
        toast.success(`Agent account created successfully${demoMsg}!`);
        onSuccess(res.data.agent, res.data.credentials);
      }
      onClose();
    } catch (err: unknown) {
      const errorData = (err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })?.response?.data;
      if (errorData?.errors) {
        const formattedErrors: Record<string, string> = {};
        Object.entries(errorData.errors).forEach(([field, msgs]) => {
          formattedErrors[field] = msgs[0];
        });
        setErrors(formattedErrors);
        toast.error('Please resolve the errors highlighted below.');
      } else {
        toast.error(errorData?.message || 'Failed to save agent account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Agent Account' : 'Create Agent Account'}
      description={
        isEdit
          ? 'Modify real estate agent details, access status, and expiry date'
          : 'Provision a new real estate agent account with scheduled access expiry'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Sarah Jenkins"
              className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                errors.name ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-rose-500 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. sarah@realty.com"
              className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                errors.email ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            {errors.email && (
              <p className="text-xs text-rose-500 mt-1">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Phone & Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +1 (555) 234-5678"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {isEdit ? 'New Password (Optional)' : 'Password (Leave blank to generate)'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isEdit ? 'Leave blank to keep unchanged' : 'Auto-generated if empty'}
                className="w-full pl-3 pr-10 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-blue-600" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Account Status & Expiry Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Account Status
            </label>
            <select
              name="account_status"
              value={formData.account_status}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="active">Active (Full Access)</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended (Access Blocked)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Status of agent access permissions
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
              <span>Access Expiry Date <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="date"
              name="subscription_expiry_date"
              required
              value={formData.subscription_expiry_date}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                errors.subscription_expiry_date ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            {/* Quick Extension Presets */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400">Presets:</span>
              {[
                { label: '+1 Mo', months: 1 },
                { label: '+3 Mo', months: 3 },
                { label: '+6 Mo', months: 6 },
                { label: '+1 Yr', months: 12 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleApplyPreset(p.months)}
                  className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
            {errors.subscription_expiry_date && (
              <p className="text-xs text-rose-500 mt-1">{errors.subscription_expiry_date}</p>
            )}
          </div>
        </div>

        {/* Demo Data Option (Only for new accounts) */}
        {!isEdit && (
          <div className="pt-1">
            <label className="flex items-start gap-3 p-3.5 bg-blue-50/60 hover:bg-blue-50/80 border border-blue-200/80 rounded-xl cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={addDemoData}
                onChange={(e) => setAddDemoData(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-semibold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Add demo data to this account
                </span>
                <span className="text-slate-600 mt-0.5 block leading-relaxed">
                  Automatically populates 6 realistic buyer/seller leads, activity timeline, and scheduled follow-ups so the agent can see how their dashboard will look right away.
                </span>
              </div>
            </label>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? 'Update Account' : 'Create Agent Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
