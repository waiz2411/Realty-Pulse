import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import api from '../../lib/api';
import type { Lead, LeadPriority, LeadSource, LeadStatus, PropertyType } from '../../types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  onSuccess: (savedLead: Lead) => void;
}

const LEAD_SOURCES: LeadSource[] = [
  'Facebook Ads',
  'Instagram',
  'WhatsApp',
  'Website',
  'Property Portal',
  'Referral',
  'Walk-in',
  'Phone Call',
  'Other',
];

const PROPERTY_TYPES: PropertyType[] = [
  'Apartment',
  'House',
  'Plot',
  'Commercial',
  'Office',
  'Other',
];

const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'site_visit_scheduled', label: 'Site Visit Scheduled' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const LEAD_PRIORITIES: { value: LeadPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
  isOpen,
  onClose,
  lead,
  onSuccess,
}) => {
  const isEdit = Boolean(lead);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'Website' as LeadSource,
    property_type: 'Apartment' as PropertyType,
    interested_property: '',
    preferred_location: '',
    budget: '',
    status: 'new' as LeadStatus,
    priority: 'medium' as LeadPriority,
    follow_up_date: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        source: (lead.source as LeadSource) || 'Website',
        property_type: (lead.property_type as PropertyType) || 'Apartment',
        interested_property: lead.interested_property || '',
        preferred_location: lead.preferred_location || '',
        budget: lead.budget || '',
        status: lead.status || 'new',
        priority: lead.priority || 'medium',
        follow_up_date: lead.follow_up_date ? lead.follow_up_date.split('T')[0] : '',
        notes: '',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        source: 'Website',
        property_type: 'Apartment',
        interested_property: '',
        preferred_location: '',
        budget: '',
        status: 'new',
        priority: 'medium',
        follow_up_date: '',
        notes: '',
      });
    }
    setErrors({});
  }, [lead, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
        follow_up_date: formData.follow_up_date || null,
      };

      let response;
      if (isEdit && lead) {
        response = await api.put(`/agent/leads/${lead.id}`, payload);
        toast.success('Lead updated successfully');
      } else {
        response = await api.post('/agent/leads', payload);
        toast.success('Lead created successfully');
      }

      onSuccess(response.data.lead);
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
        toast.error(errorData?.message || 'Failed to save lead');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Lead' : 'Add New Lead'}
      description={
        isEdit
          ? 'Update contact details, interest, and status'
          : 'Fill in details to track a new prospective client'
      }
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            1. Basic Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="e.g. Michael Vance"
                className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                  errors.name ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-rose-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +1 (555) 019-2831"
                className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                  errors.phone ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {errors.phone && (
                <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. michael.vance@example.com"
                className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                  errors.email ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {errors.email && (
                <p className="text-xs text-rose-500 mt-1">{errors.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Property Interest */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            2. Property Interest
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Property Type
              </label>
              <select
                name="property_type"
                value={formData.property_type}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Budget / Price Range
              </label>
              <input
                type="text"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                placeholder="e.g. $750,000 - $850,000"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              >
              </input>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Interested Property / Unit
              </label>
              <input
                type="text"
                name="interested_property"
                value={formData.interested_property}
                onChange={handleChange}
                placeholder="e.g. Skyline Penthouse 14B"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Preferred Location
              </label>
              <input
                type="text"
                name="preferred_location"
                value={formData.preferred_location}
                onChange={handleChange}
                placeholder="e.g. Financial District"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Lead Management */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            3. Lead Management & Follow-up
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Lead Source
              </label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              >
                {LEAD_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Lead Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              >
                {LEAD_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              >
                {LEAD_PRIORITIES.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Follow-up Date
              </label>
              <input
                type="date"
                name="follow_up_date"
                value={formData.follow_up_date}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Notes (Only for new lead or append note) */}
        {!isEdit && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              4. Initial Note (Optional)
            </h4>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              placeholder="e.g. Client inquired about 3-bedroom units with high-floor views..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Update Lead' : 'Save Lead'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
