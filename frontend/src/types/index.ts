export type UserRole = 'admin' | 'agent';
export type AccountStatus = 'active' | 'inactive' | 'suspended';
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'custom';
export type SubscriptionStatus = 'active' | 'expired' | 'trial' | 'cancelled';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  account_status: AccountStatus;
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  subscription_start_date?: string | null;
  subscription_expiry_date?: string | null;
  is_blocked?: boolean;
  last_login_at?: string | null;
  created_at: string;
  leads_count?: number;
}

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'site_visit_scheduled'
  | 'negotiation'
  | 'won'
  | 'lost';

export type LeadPriority = 'low' | 'medium' | 'high';

export type LeadSource =
  | 'Facebook Ads'
  | 'Instagram'
  | 'WhatsApp'
  | 'Website'
  | 'Property Portal'
  | 'Referral'
  | 'Walk-in'
  | 'Phone Call'
  | 'Other';

export type PropertyType =
  | 'Apartment'
  | 'House'
  | 'Plot'
  | 'Commercial'
  | 'Office'
  | 'Other';

export interface LeadNote {
  id: number;
  lead_id: number;
  agent_id: number;
  note: string;
  created_at: string;
  updated_at?: string;
}

export interface LeadActivity {
  id: number;
  lead_id: number;
  agent_id: number;
  activity_type:
    | 'lead_created'
    | 'status_changed'
    | 'note_added'
    | 'lead_updated'
    | 'follow_up_date_changed';
  description: string;
  old_value?: string | null;
  new_value?: string | null;
  created_at: string;
}

export interface Lead {
  id: number;
  agent_id: number;
  name: string;
  phone: string;
  email?: string | null;
  source: LeadSource | string;
  property_type: PropertyType | string;
  interested_property?: string | null;
  preferred_location?: string | null;
  budget?: string | null;
  status: LeadStatus;
  priority: LeadPriority;
  follow_up_date?: string | null;
  created_at: string;
  updated_at: string;
  agent?: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
  };
  notes?: LeadNote[];
  activities?: LeadActivity[];
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url?: string | null;
  path: string;
  per_page: number;
  prev_page_url?: string | null;
  to: number;
  total: number;
}

export interface AdminStats {
  overview: {
    total_agents: number;
    active_agents: number;
    suspended_agents: number;
    total_leads: number;
    leads_added_today: number;
    active_subscriptions: number;
    expired_subscriptions: number;
  };
  analytics: {
    leads_by_status: Record<string, number>;
    top_agents: {
      id: number;
      name: string;
      email: string;
      account_status: AccountStatus;
      leads_count: number;
    }[];
  };
}

export interface AgentStats {
  total_leads: number;
  new_leads: number;
  contacted_leads: number;
  qualified_leads: number;
  site_visit_scheduled: number;
  negotiation_leads: number;
  closed_deals: number;
  lost_leads: number;
  followups_today: number;
  followups_overdue: number;
}

export interface FollowUpGrouped {
  overdue: Lead[];
  today: Lead[];
  upcoming: Lead[];
  counts: {
    overdue: number;
    today: number;
    upcoming: number;
  };
}
