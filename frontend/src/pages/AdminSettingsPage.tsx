import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Shield, Lock, User, Server, Database, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const AdminSettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', { name, phone });
      updateUser(res.data.user);
      toast.success('Admin profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== newPasswordConfirmation) {
      toast.error('Passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      });
      toast.success('Admin password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirmation('');
    } catch {
      toast.error('Failed to update password. Check current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          <span>Platform Owner Settings</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure Super Admin credentials, authentication security, and view platform runtime
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Admin Profile */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-purple-600" />
              <span>Super Admin Profile</span>
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Master Super Admin Email
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  {savingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-purple-600" />
              <span>Security & Password</span>
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPasswordConfirmation}
                    onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  {changingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Platform Architecture Info */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-600" />
              <span>Architecture & Stack</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Architecture</span>
                <span className="font-semibold text-slate-800">Multi-Tenant Shared DB</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Auth Engine</span>
                <span className="font-semibold text-slate-800">Laravel Sanctum</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Database Engine</span>
                <span className="font-semibold text-slate-800">MySQL 8.4</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Frontend</span>
                <span className="font-semibold text-slate-800">React + TS + Tailwind v4</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Data Isolation</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
