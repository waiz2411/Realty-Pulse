# RealtyPulse — Real Estate Lead Management SaaS

A complete, functional, modern multi-tenant SaaS application built for real estate agents to manage their prospective buyers and sellers, track follow-ups, and close deals, with a dedicated Super Admin platform owner portal.

---

## 1. Credentials & Demo Accounts

All accounts are pre-seeded and ready to use immediately:

| Role | Name | Email | Password | Status & Plan | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Platform Super Admin | `admin@realestatecrm.com` | `Password123!` | Active (Pro) | Complete platform control, tenant management, analytics |
| **Agent** | Sarah Jenkins | `sarah@realty.com` | `Password123!` | Active (Pro) | 7 pre-loaded leads, follow-ups today & overdue |
| **Agent** | David Chen | `david@realty.com` | `Password123!` | Active (Basic) | 3 pre-loaded leads |
| **Agent (Suspended)** | Elena Rostova | `elena@realty.com` | `Password123!` | Suspended | Verifies 403 account suspension lock screen |
| **Agent (Expired)** | Marcus Sterling | `marcus@realty.com` | `Password123!` | Expired | Verifies 403 expired subscription lock screen |

> **Convenience Feature**: The login screen and top navigation bar include a **"One-Click Demo Switcher"** to instantly test each role without re-typing credentials!

---

## 2. Technology Stack

- **Backend**: Laravel 11/12 (PHP 8.3)
- **Database**: MySQL 8.4 (`real_estate_leads`)
- **Authentication**: Laravel Sanctum (API Tokens)
- **Frontend**: React 19 + TypeScript (Vite 8)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: Sonner (Toast notifications)
- **HTTP Client**: Axios with Sanctum bearer token interceptors

---

## 3. Architecture & Multi-Tenant Data Isolation

### Shared Database with Tenant Scoping
- Every `leads`, `lead_notes`, and `lead_activities` record is foreign-keyed to an `agent_id` (`users.id`).
- All Agent queries are scoped server-side using `$request->user()->leads()` to ensure 100% IDOR protection. Agents **never** have access to other agents' leads, accounts, notes, or timelines.
- The Super Admin has global visibility across all tenants and leads.

### Account Suspension & Subscription Expiry Guard
- Middleware `EnsureAgentNotBlocked` (`agent.active`) intercepts every Agent lead operation and dashboard query:
  - If `account_status === 'suspended'` or `'inactive'`, access is blocked (HTTP 403 `ACCOUNT_SUSPENDED`).
  - If `subscription_status === 'expired'` or `subscription_expiry_date < today`, access is blocked (HTTP 403 `SUBSCRIPTION_EXPIRED`).
  - The agent sees an informative **Account Blocked / Expired Status Screen** with contact instructions while their data is 100% preserved.

---

## 4. Features Implemented

### A. Super Admin (Platform Owner)
- **Overview Dashboard Cards**: Total Agents, Active Agents, Suspended Agents, Total Platform Leads, Leads Added Today, Active Subscriptions, Expired Subscriptions.
- **Analytics Charts**: Platform Leads by Status (Recharts visual bar distribution) and Top Agents by Lead Volume.
- **Recent Agents & Platform Leads**: Global live activity tables with click-to-view profiles.
- **Agent Account Provisioning**:
  - Create new agents with Full Name, Email, Phone, Password, Account Status, Subscription Plan, and Subscription Expiry Date.
  - Generates secure credentials with a dedicated **One-Click Copy Credentials Modal**.
- **Agent Lifecycle Controls**: Edit agent details, activate, suspend, reset password, and permanent delete with confirmation modal.
- **Agent Profile Detail View**: Drill down into any agent to inspect their lead conversion rates, overdue follow-ups, and full lead list.
- **Platform-wide Leads Page**: Search and filter all leads across all agents with multi-select filters.

### B. Real Estate Agent
- **Dashboard**:
  - 5 Overview Cards: Total Leads, New Leads, Contacted Leads, Qualified Leads, Closed Deals (Won).
  - **Follow-ups Today** card with direct Click-to-Call and Click-to-WhatsApp links.
  - **Upcoming Follow-ups** card.
  - **Recent Leads** table.
  - Quick action buttons ("Add New Lead", "View All Leads").
- **Leads Management**:
  - Full CRUD operations with responsive two-column desktop / single-column mobile modal.
  - Lead Fields: Name, Phone, Email, Source (Facebook Ads, Instagram, WhatsApp, Website, etc.), Property Type (Apartment, House, Plot, Commercial, Office, Other), Interested Property, Preferred Location, Budget, Status, Priority, Follow-up Date, and Notes.
  - Dedicated search (by name, phone, email, property) and filters (status, source, priority, timing).
  - Server-side pagination.
  - Inline fast status changer dropdown.
- **Lead Profile & Activity Timeline**:
  - Full contact card with Click-to-Call (`tel:`) and Click-to-WhatsApp (`https://wa.me/`).
  - Real-time timestamped notes.
  - Chronological activity timeline (Lead created, status changed, note added, lead updated, follow-up date changed).
- **Follow-up Management**:
  - Simple 3-tier view:
    - **Overdue** (Red indicator)
    - **Today** (Orange indicator)
    - **Upcoming** (Neutral indicator)
  - Quick action modal to complete follow-ups, schedule the next date, and log outcome notes.
- **Agent Settings**:
  - View & edit profile name and phone number.
  - Secure change password form.
  - View subscription tier and renewal date.

---

## 5. API Documentation

### Public Endpoints
- `POST /api/auth/login`: Authenticate and return Sanctum Bearer token and user object.

### Authenticated Common (`auth:sanctum`)
- `GET /api/auth/me`: Get current authenticated user details and subscription state.
- `POST /api/auth/logout`: Revoke active Sanctum token.
- `PUT /api/auth/profile`: Update profile name and phone number.
- `POST /api/auth/change-password`: Update password (validates current password).

### Super Admin (`auth:sanctum` + `admin`)
- `GET /api/admin/dashboard/stats`: Global overview metrics and lead distribution.
- `GET /api/admin/dashboard/recent-agents`: Latest 5 agent registrations.
- `GET /api/admin/dashboard/recent-leads`: Latest 10 platform-wide leads.
- `GET /api/admin/agents`: Paginated list of agents with search and status filters.
- `POST /api/admin/agents`: Provision new agent account.
- `GET /api/admin/agents/{id}`: Detailed agent profile with performance metrics and leads.
- `PUT /api/admin/agents/{id}`: Edit agent details and subscription.
- `PATCH /api/admin/agents/{id}/status`: Activate or suspend agent account.
- `POST /api/admin/agents/{id}/reset-password`: Reset agent password and return temporary password.
- `DELETE /api/admin/agents/{id}`: Permanently delete agent account and cascade tenant data.
- `GET /api/admin/leads`: Global searchable and filterable leads across all agents.

### Agent Protected (`auth:sanctum` + `agent.active`)
- `GET /api/agent/dashboard/stats`: Agent-specific counts (total, new, contacted, qualified, won, lost, today's followups).
- `GET /api/agent/dashboard/recent-leads`: Agent's 5 latest leads.
- `GET /api/agent/dashboard/today-followups`: Leads scheduled for follow-up today.
- `GET /api/agent/dashboard/upcoming-followups`: Leads scheduled for future follow-up.
- `GET /api/agent/leads`: Paginated list of agent's own leads with search and filters.
- `POST /api/agent/leads`: Create new lead (with optional initial note and activity log).
- `GET /api/agent/leads/{id}`: View lead details, notes, and activity timeline.
- `PUT /api/agent/leads/{id}`: Update lead information (logs status & follow-up changes).
- `PATCH /api/agent/leads/{id}/status`: Fast status transition.
- `POST /api/agent/leads/{id}/notes`: Add note to lead.
- `DELETE /api/agent/leads/{id}`: Delete lead.
- `GET /api/agent/followups`: Grouped follow-ups (overdue, today, upcoming).
- `POST /api/agent/leads/{id}/complete-followup`: Complete follow-up, reschedule, and update status.

---

## 6. Installation & Setup Instructions

### Prerequisites
- PHP 8.2 or 8.3 with extensions (`pdo_mysql`, `mbstring`, `openssl`, `curl`)
- Composer
- Node.js (v18+) & npm
- MySQL Server (port 3306)

### 1. Backend Setup
```bash
cd backend

# Create .env from example (configured for MySQL)
# Set DB_CONNECTION=mysql, DB_DATABASE=real_estate_leads, DB_USERNAME=root, DB_PASSWORD=

# Run migrations and seed the database with initial users and leads
php artisan migrate:fresh --seed

# Start the Laravel backend server
php artisan serve --port=8000
```

### 2. Frontend Setup
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server (proxies /api to http://127.0.0.1:8000)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 7. Verification & Testing Results

An automated integration test suite verified the application against all user requirements:
- **Admin Authentication**: Verified Super Admin login and platform dashboard metrics.
- **Agent Provisioning**: Verified agent creation, secure password hashing, role assignment, and one-time credentials generation.
- **Agent Instant Login**: Verified new agent can immediately log in with generated credentials.
- **Lead Lifecycle**: Verified lead creation, status updates, note creation, and activity logging.
- **Follow-up Handling**: Verified completing follow-ups, date transitions, and rescheduling.
- **Multi-Tenant Isolation**: Verified Agent Sarah receives `404 Not Found` when trying to access another agent's lead ID.
- **Role Enforcement**: Verified Agent receives `403 Forbidden` when attempting to access Super Admin routes.
- **Suspension Enforcement**: Verified suspended agent receives `403 Forbidden` (`ACCOUNT_SUSPENDED`) and is locked out of lead management.
- **Expired Subscription Enforcement**: Verified expired subscription blocks lead operations (`SUBSCRIPTION_EXPIRED`).
- **Cascade Deletion**: Verified deleting an agent cleanly cascades tenant leads, notes, and activity logs.
