<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminAgentController extends Controller
{
    /**
     * List all agents with search, filter, and pagination
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::where('role', 'agent')
            ->withCount('leads')
            ->latest();

        // Search by name or email or phone
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Filter by account_status
        if ($accountStatus = $request->query('account_status')) {
            $query->where('account_status', $accountStatus);
        }

        // Filter by subscription_status
        if ($subscriptionStatus = $request->query('subscription_status')) {
            $query->where('subscription_status', $subscriptionStatus);
        }

        // Filter by subscription_plan
        if ($subscriptionPlan = $request->query('subscription_plan')) {
            $query->where('subscription_plan', $subscriptionPlan);
        }

        $perPage = (int) $request->query('per_page', 10);
        $agents = $query->paginate($perPage);

        return response()->json($agents);
    }

    /**
     * Create a new agent account
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:30',
            'password' => 'nullable|string|min:6',
            'account_status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'subscription_plan' => ['required', Rule::in(['free', 'basic', 'pro', 'custom'])],
            'subscription_status' => ['nullable', Rule::in(['active', 'expired', 'trial', 'cancelled'])],
            'subscription_expiry_date' => 'nullable|date',
        ]);

        $plainPassword = ! empty($validated['password'])
            ? $validated['password']
            : Str::random(10);

        $agent = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($plainPassword),
            'role' => 'agent',
            'account_status' => $validated['account_status'],
            'subscription_plan' => $validated['subscription_plan'],
            'subscription_status' => $validated['subscription_status'] ?? 'active',
            'subscription_start_date' => now()->toDateString(),
            'subscription_expiry_date' => $validated['subscription_expiry_date'] ?? now()->addMonth()->toDateString(),
        ]);

        $this->clearAdminCache();

        return response()->json([
            'message' => 'Agent account created successfully',
            'agent' => $agent->loadCount('leads'),
            // Return plain credentials only once for copy/paste sharing
            'credentials' => [
                'email' => $agent->email,
                'password' => $plainPassword,
            ],
        ], 201);
    }

    /**
     * Get single agent details with stats and recent leads
     */
    public function show($id): JsonResponse
    {
        $agent = User::where('role', 'agent')
            ->withCount('leads')
            ->findOrFail($id);

        $today = now()->toDateString();
        $row = DB::table('leads')
            ->where('agent_id', $agent->id)
            ->selectRaw("
                COUNT(*) as total_leads,
                SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_leads,
                SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
                SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) as qualified,
                SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won,
                SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost,
                SUM(CASE WHEN follow_up_date < ? AND status NOT IN ('won', 'lost') THEN 1 ELSE 0 END) as overdue_followups,
                SUM(CASE WHEN follow_up_date = ? THEN 1 ELSE 0 END) as today_followups
            ", [$today, $today])
            ->first();

        $stats = [
            'total_leads' => (int) ($row->total_leads ?? 0),
            'new_leads' => (int) ($row->new_leads ?? 0),
            'contacted' => (int) ($row->contacted ?? 0),
            'qualified' => (int) ($row->qualified ?? 0),
            'won' => (int) ($row->won ?? 0),
            'lost' => (int) ($row->lost ?? 0),
            'overdue_followups' => (int) ($row->overdue_followups ?? 0),
            'today_followups' => (int) ($row->today_followups ?? 0),
        ];

        $recentLeads = $agent->leads()
            ->latest()
            ->limit(10)
            ->get();

        return response()->json([
            'agent' => $agent,
            'stats' => $stats,
            'recent_leads' => $recentLeads,
        ]);
    }

    /**
     * Update agent account information
     */
    public function update(Request $request, $id): JsonResponse
    {
        $agent = User::where('role', 'agent')->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($agent->id)],
            'phone' => 'nullable|string|max:30',
            'account_status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'subscription_plan' => ['required', Rule::in(['free', 'basic', 'pro', 'custom'])],
            'subscription_status' => ['required', Rule::in(['active', 'expired', 'trial', 'cancelled'])],
            'subscription_expiry_date' => 'nullable|date',
            'password' => 'nullable|string|min:6',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'account_status' => $validated['account_status'],
            'subscription_plan' => $validated['subscription_plan'],
            'subscription_status' => $validated['subscription_status'],
            'subscription_expiry_date' => $validated['subscription_expiry_date'] ?? null,
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $agent->update($updateData);

        $this->clearAdminCache();

        return response()->json([
            'message' => 'Agent account updated successfully',
            'agent' => $agent->fresh()->loadCount('leads'),
        ]);
    }

    /**
     * Activate, Inactivate or Suspend agent
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $agent = User::where('role', 'agent')->findOrFail($id);

        $validated = $request->validate([
            'account_status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
        ]);

        $agent->update([
            'account_status' => $validated['account_status'],
        ]);

        $this->clearAdminCache();

        return response()->json([
            'message' => "Agent account is now {$validated['account_status']}",
            'agent' => $agent->loadCount('leads'),
        ]);
    }

    /**
     * Reset agent password
     */
    public function resetPassword(Request $request, $id): JsonResponse
    {
        $agent = User::where('role', 'agent')->findOrFail($id);

        $validated = $request->validate([
            'password' => 'nullable|string|min:6',
        ]);

        $newPassword = ! empty($validated['password'])
            ? $validated['password']
            : Str::random(10);

        $agent->update([
            'password' => Hash::make($newPassword),
        ]);

        // Revoke all existing tokens for security
        $agent->tokens()->delete();

        return response()->json([
            'message' => 'Agent password has been reset successfully',
            'credentials' => [
                'email' => $agent->email,
                'password' => $newPassword,
            ],
        ]);
    }

    /**
     * Delete agent account with confirmation
     */
    public function destroy($id): JsonResponse
    {
        $agent = User::where('role', 'agent')->findOrFail($id);

        $agentName = $agent->name;
        $agent->delete();

        $this->clearAdminCache();

        return response()->json([
            'message' => "Agent account '{$agentName}' has been permanently deleted.",
        ]);
    }

    private function clearAdminCache(): void
    {
        Cache::forget('admin_dashboard_stats');
        Cache::forget('admin_recent_agents');
    }
}
