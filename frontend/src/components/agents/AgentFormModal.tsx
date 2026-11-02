import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import api from '../../lib/api';
import type {
  User,
  AccountStatus,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../../types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AgentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: User | null;
  onSuccess: (agent: User, credentials?: { email: string; password: string }) => void;
}

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
    subscription_plan: 'basic' as SubscriptionPlan,
    subscription_status: 'active' as SubscriptionStatus,
    subscription_expiry_date: '',
  });

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
        subscription_plan: agent.subscription_plan || 'basic',
        subscription_status: agent.subscription_status || 'active',
        subscription_expiry_date: agent.subscription_expiry_date
          ? agent.subscription_expiry_date.split('T')[0]
          : '',
      });
    } else {
      // Default expiry 1 month from now
      const oneMonth = new Date();
      oneMonth.setMonth(oneMonth.getMonth() + 1);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        account_status: 'active',
        subscription_plan: 'basic',
        subscription_status: 'active',
        subscription_expiry_date: oneMonth.toISOString().split('T')[0],
      });
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const payload = {
        ...formData,
        subscription_expiry_date: formData.subscription_expiry_date || null,
        password: formData.password || undefined,
      };

      if (isEdit && agent) {
        const res = await api.put(`/admin/agents/${agent.id}`, payload);
        toast.success('Agent updated successfully');
        onSuccess(res.data.agent);
      } else {
        const res = await api.post('/admin/agents', payload);
        toast.success('Agent account created successfully');
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
          ? 'Modify real estate agent permissions, status and subscription'
          : 'Provision a new real estate agent tenant workspace'
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
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={isEdit ? 'Leave blank to keep unchanged' : 'Auto-generated if empty'}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Account Status & Subscription Plan */}
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
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Subscription Plan
            </label>
            <select
              name="subscription_plan"
              value={formData.subscription_plan}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Subscription Status & Expiry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Subscription Status
            </label>
            <select
              name="subscription_status"
              value={formData.subscription_status}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="expired">Expired (Blocks Access)</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Subscription Expiry Date
            </label>
            <input
              type="date"
              name="subscription_expiry_date"
              value={formData.subscription_expiry_date}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? 'Update Account' : 'Create Agent Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
