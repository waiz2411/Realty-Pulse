import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { BlockedAccountPage } from './pages/BlockedAccountPage';
import { AgentDashboard } from './pages/AgentDashboard';
import { AgentLeadsPage } from './pages/AgentLeadsPage';
import { AgentFollowUpsPage } from './pages/AgentFollowUpsPage';
import { AgentSettingsPage } from './pages/AgentSettingsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminAgentsPage } from './pages/AdminAgentsPage';
import { AdminAllLeadsPage } from './pages/AdminAllLeadsPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { LeadFormModal } from './components/leads/LeadFormModal';
import { LeadDetailModal } from './components/leads/LeadDetailModal';
import { AgentFormModal } from './components/agents/AgentFormModal';
import { AgentDetailModal } from './components/agents/AgentDetailModal';
import { CredentialsModal } from './components/agents/CredentialsModal';
import api from './lib/api';
import type { Lead, User } from './types';
import { Toaster, toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  // Tab state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [leadFormModalOpen, setLeadFormModalOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);

  const [leadDetailModalOpen, setLeadDetailModalOpen] = useState(false);
  const [selectedLeadIdForDetail, setSelectedLeadIdForDetail] = useState<number | null>(null);

  const [agentFormModalOpen, setAgentFormModalOpen] = useState(false);
  const [selectedAgentForEdit, setSelectedAgentForEdit] = useState<User | null>(null);

  const [agentDetailModalOpen, setAgentDetailModalOpen] = useState(false);
  const [selectedAgentIdForDetail, setSelectedAgentIdForDetail] = useState<number | null>(null);

  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    name?: string;
    email: string;
    password: string;
  } | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Sync tab when user changes role
  React.useEffect(() => {
    if (user?.role === 'admin') {
      setCurrentTab('admin-dashboard');
    } else {
      setCurrentTab('dashboard');
    }
  }, [user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading RealtyPulse...</p>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // If user is an agent and blocked (suspended or expired subscription), show blocked page
  // Unless user specifically wants to open settings to change password/view profile
  const isAgentBlocked =
    user.role === 'agent' &&
    (user.is_blocked ||
      user.account_status === 'suspended' ||
      user.subscription_status === 'expired');

  if (isAgentBlocked && currentTab !== 'settings') {
    return <BlockedAccountPage onNavigateToSettings={() => setCurrentTab('settings')} />;
  }

  // Determine current page title
  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Agent Dashboard';
      case 'leads':
        return 'Leads Management';
      case 'followups':
        return 'Follow-ups';
      case 'settings':
        return 'Account Settings';
      case 'admin-dashboard':
        return 'Platform Super Admin Dashboard';
      case 'admin-agents':
        return 'Agent Accounts Management';
      case 'admin-leads':
        return 'Platform Leads';
      case 'admin-settings':
        return 'Platform Settings';
      default:
        return 'RealtyPulse CRM';
    }
  };

  // Handlers for Leads
  const handleOpenAddLead = () => {
    setSelectedLeadForEdit(null);
    setLeadFormModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLeadForEdit(lead);
    setLeadFormModalOpen(true);
  };

  const handleViewLead = (leadId: number) => {
    setSelectedLeadIdForDetail(leadId);
    setLeadDetailModalOpen(true);
  };

  const handleLeadSaved = (savedLead: Lead) => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Handlers for Agents
  const handleOpenCreateAgent = () => {
    setSelectedAgentForEdit(null);
    setAgentFormModalOpen(true);
  };

  const handleEditAgent = (agent: User) => {
    setSelectedAgentForEdit(agent);
    setAgentFormModalOpen(true);
  };

  const handleViewAgent = (agentId: number) => {
    setSelectedAgentIdForDetail(agentId);
    setAgentDetailModalOpen(true);
  };

  const handleResetAgentPassword = async (agent: User) => {
    try {
      const res = await api.post(`/admin/agents/${agent.id}/reset-password`);
      toast.success('Agent password reset successfully');
      setCreatedCredentials({
        name: agent.name,
        email: agent.email,
        password: res.data.credentials.password,
      });
      setCredentialsModalOpen(true);
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      toast.error('Failed to reset password');
    }
  };

  const handleAgentSaved = (
    savedAgent: User,
    credentials?: { email: string; password: string }
  ) => {
    setRefreshTrigger((prev) => prev + 1);
    if (credentials) {
      setCreatedCredentials({
        name: savedAgent.name,
        email: credentials.email,
        password: credentials.password,
      });
      setCredentialsModalOpen(true);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          pageTitle={getPageTitle()}
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
          onNavigateToSettings={() =>
            setCurrentTab(user.role === 'admin' ? 'admin-settings' : 'settings')
          }
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Agent Views */}
          {user.role === 'agent' && (
            <>
              {currentTab === 'dashboard' && (
                <AgentDashboard
                  onNavigateToLeads={() => setCurrentTab('leads')}
                  onNavigateToFollowUps={() => setCurrentTab('followups')}
                  onOpenAddLeadModal={handleOpenAddLead}
                  onViewLead={handleViewLead}
                />
              )}
              {currentTab === 'leads' && (
                <AgentLeadsPage
                  onOpenAddLeadModal={handleOpenAddLead}
                  onEditLead={handleEditLead}
                  onViewLead={handleViewLead}
                  refreshTrigger={refreshTrigger}
                />
              )}
              {currentTab === 'followups' && (
                <AgentFollowUpsPage onViewLead={handleViewLead} />
              )}
              {currentTab === 'settings' && <AgentSettingsPage />}
            </>
          )}

          {/* Super Admin Views */}
          {user.role === 'admin' && (
            <>
              {currentTab === 'admin-dashboard' && (
                <AdminDashboard
                  onNavigateToAgents={() => setCurrentTab('admin-agents')}
                  onNavigateToAllLeads={() => setCurrentTab('admin-leads')}
                  onOpenCreateAgentModal={handleOpenCreateAgent}
                  onViewAgent={handleViewAgent}
                />
              )}
              {currentTab === 'admin-agents' && (
                <AdminAgentsPage
                  onOpenCreateModal={handleOpenCreateAgent}
                  onEditAgent={handleEditAgent}
                  onViewAgent={handleViewAgent}
                  onResetPassword={handleResetAgentPassword}
                  refreshTrigger={refreshTrigger}
                />
              )}
              {currentTab === 'admin-leads' && (
                <AdminAllLeadsPage onViewLead={handleViewLead} />
              )}
              {currentTab === 'admin-settings' && <AdminSettingsPage />}
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <LeadFormModal
        isOpen={leadFormModalOpen}
        onClose={() => setLeadFormModalOpen(false)}
        lead={selectedLeadForEdit}
        onSuccess={handleLeadSaved}
      />

      <LeadDetailModal
        isOpen={leadDetailModalOpen}
        onClose={() => setLeadDetailModalOpen(false)}
        leadId={selectedLeadIdForDetail}
        onEdit={handleEditLead}
        onLeadUpdated={() => setRefreshTrigger((p) => p + 1)}
      />

      <AgentFormModal
        isOpen={agentFormModalOpen}
        onClose={() => setAgentFormModalOpen(false)}
        agent={selectedAgentForEdit}
        onSuccess={handleAgentSaved}
      />

      <AgentDetailModal
        isOpen={agentDetailModalOpen}
        onClose={() => setAgentDetailModalOpen(false)}
        agentId={selectedAgentIdForDetail}
        onEdit={handleEditAgent}
        onResetPassword={handleResetAgentPassword}
        onStatusChanged={() => setRefreshTrigger((p) => p + 1)}
      />

      <CredentialsModal
        isOpen={credentialsModalOpen}
        onClose={() => setCredentialsModalOpen(false)}
        credentials={createdCredentials}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <AppContent />
    </AuthProvider>
  );
}

export default App;
