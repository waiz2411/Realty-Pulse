import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Settings,
  Shield,
  Building2,
  FolderOpen,
  LogOut,
  X,
  CreditCard,
  AlertCircle,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const agentNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: FolderOpen },
    { id: 'followups', label: 'Follow-ups', icon: CalendarCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-agents', label: 'Agents', icon: Users },
    { id: 'admin-leads', label: 'All Leads', icon: Building2 },
    { id: 'admin-settings', label: 'Settings', icon: Settings },
  ];

  const navItems = isAdmin ? adminNavItems : agentNavItems;

  const handleItemClick = (id: string) => {
    onTabChange(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 tracking-tight leading-none">
                RealtyPulse
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-1">
                Lead Management
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role & Workspace Badge */}
        <div className="px-4 py-3 mx-3 my-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
          <div
            className={`w-2 h-2 rounded-full ${
              isAdmin ? 'bg-purple-600' : 'bg-blue-600'
            }`}
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 truncate">
              {isAdmin ? 'Super Admin Portal' : 'Agent Workspace'}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {isAdmin ? 'Platform Owner' : user?.name}
            </div>
          </div>
          {isAdmin && (
            <Shield className="w-4 h-4 text-purple-600 shrink-0" />
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Subscription Info (For Agents) */}
        {!isAdmin && user && (
          <div className="px-3 py-2 mx-3 my-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 font-medium">Subscription</span>
              <span className="font-semibold text-slate-800 uppercase text-[10px]">
                {user.subscription_plan}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Status:</span>
              <span
                className={`font-medium capitalize ${
                  user.subscription_status === 'active'
                    ? 'text-emerald-600'
                    : 'text-rose-600'
                }`}
              >
                {user.subscription_status}
              </span>
            </div>
            {user.subscription_expiry_date && (
              <div className="text-[10px] text-slate-400 mt-1">
                Renews/Expires: {user.subscription_expiry_date}
              </div>
            )}
          </div>
        )}

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {user?.name}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {user?.email}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
