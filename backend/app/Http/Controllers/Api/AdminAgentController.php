<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadActivity;
use App\Models\LeadNote;
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

        // Filter by account_status or access status (active, expired, suspended, inactive)
        if ($accountStatus = $request->query('account_status')) {
            $today = now()->toDateString();
            if ($accountStatus === 'expired') {
                $query->whereNotNull('subscription_expiry_date')
                      ->where('subscription_expiry_date', '<', $today);
            } elseif ($accountStatus === 'active') {
                $query->where('account_status', 'active')
                      ->where(function ($q) use ($today) {
                          $q->whereNull('subscription_expiry_date')
                            ->orWhere('subscription_expiry_date', '>=', $today);
                      });
            } else {
                $query->where('account_status', $accountStatus);
            }
        }

        $perPage = (int) $request->query('per_page', 10);
        $agents = $query->paginate($perPage);

        return response()->json($agents);
    }

    /**
     * Create a new agent account (with optional instant demo leads)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:30',
            'password' => 'nullable|string|min:6',
            'account_status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'subscription_expiry_date' => 'required|date',
            'add_demo_data' => 'nullable|boolean',
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
            'subscription_plan' => 'standard',
            'subscription_status' => 'active',
            'subscription_start_date' => now()->toDateString(),
            'subscription_expiry_date' => $validated['subscription_expiry_date'],
        ]);

        $demoLeadsCreated = 0;
        if ($request->boolean('add_demo_data')) {
            $demoLeadsCreated = $this->seedDemoLeadsForAgent($agent);
        }

        $this->clearAdminCache();

        return response()->json([
            'message' => $demoLeadsCreated > 0
                ? "Agent account created successfully with {$demoLeadsCreated} sample leads!"
                : 'Agent account created successfully',
            'agent' => $agent->fresh()->loadCount('leads'),
            'demo_leads_created' => $demoLeadsCreated,
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
            'subscription_expiry_date' => 'required|date',
            'password' => 'nullable|string|min:6',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'account_status' => $validated['account_status'],
            'subscription_expiry_date' => $validated['subscription_expiry_date'],
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

    /**
     * Seed realistic sample demo leads for an agent
     */
    public function seedDemoData($id): JsonResponse
    {
        $agent = User::where('role', 'agent')->findOrFail($id);
        $count = $this->seedDemoLeadsForAgent($agent);

        $this->clearAdminCache();
        Cache::forget("agent_stats_{$agent->id}");

        return response()->json([
            'message' => "Successfully populated {$count} sample demo leads for {$agent->name}!",
            'leads_count' => $agent->leads()->count(),
            'agent' => $agent->fresh()->loadCount('leads'),
        ]);
    }

    /**
     * Internal helper to create 6 rich demo leads with notes & activities
     */
    private function seedDemoLeadsForAgent(User $agent): int
    {
        $today = now()->toDateString();
        $tomorrow = now()->addDay()->toDateString();
        $inThreeDays = now()->addDays(3)->toDateString();
        $yesterday = now()->subDays(2)->toDateString();

        $demoLeads = [
            [
                'name' => 'Sarah Mitchell',
                'phone' => '+1 (555) 349-8201',
                'email' => 'sarah.m@example.com',
                'source' => 'Website',
                'property_type' => 'Apartment',
                'interested_property' => 'Skyline Towers - 3BHK Luxury Suite',
                'preferred_location' => 'Downtown Central',
                'budget' => '$485,000',
                'status' => 'new',
                'priority' => 'high',
                'follow_up_date' => $today,
                'notes' => [
                    'Client registered through website inquiry form. Looking for high floor unit with parking.',
                    'Prefers south-facing balcony. Ready for site visit this Saturday.',
                ],
            ],
            [
                'name' => 'Michael Vance',
                'phone' => '+1 (555) 721-4490',
                'email' => 'marcus.v@example.com',
                'source' => 'Facebook Ads',
                'property_type' => 'House',
                'interested_property' => 'The Grand Oak Villa - 4 Bed with Pool',
                'preferred_location' => 'Greenhill Suburbs',
                'budget' => '$850,000',
                'status' => 'qualified',
                'priority' => 'high',
                'follow_up_date' => $tomorrow,
                'notes' => [
                    'Mortgage pre-approved up to $900k through Chase Bank. Family of 4 relocating in summer.',
                ],
            ],
            [
                'name' => 'Jessica Lin',
                'phone' => '+1 (555) 489-1123',
                'email' => 'jessica.lin@example.com',
                'source' => 'Phone Call',
                'property_type' => 'Commercial',
                'interested_property' => 'Innovation Hub Ground Floor Retail',
                'preferred_location' => 'Business District',
                'budget' => '$1,200,000',
                'status' => 'site_visit_scheduled',
                'priority' => 'medium',
                'follow_up_date' => $inThreeDays,
                'notes' => [
                    'Site visit scheduled for Thursday 3:00 PM. Requested floor plans and lease history.',
                ],
            ],
            [
                'name' => 'David & Lisa Ramirez',
                'phone' => '+1 (555) 672-9934',
                'email' => 'ramirez.family@example.com',
                'source' => 'Instagram',
                'property_type' => 'Apartment',
                'interested_property' => 'Harborfront Studio Loft 4B',
                'preferred_location' => 'Marina Bay',
                'budget' => '$340,000',
                'status' => 'negotiation',
                'priority' => 'high',
                'follow_up_date' => $today,
                'notes' => [
                    'Initial offer submitted at $325,000. Seller willing to counter at $335,000 including custom kitchen island.',
                ],
            ],
            [
                'name' => 'Victoria Bennett',
                'phone' => '+1 (555) 231-8845',
                'email' => 'v.bennett@example.com',
                'source' => 'Referral',
                'property_type' => 'Plot',
                'interested_property' => 'Pinecrest Scenic Hill Plot (0.75 Acre)',
                'preferred_location' => 'Highland Valley',
                'budget' => '$275,000',
                'status' => 'won',
                'priority' => 'medium',
                'follow_up_date' => null,
                'notes' => [
                    'Title transferred and closing completed smoothly! Commission disbursed.',
                ],
            ],
            [
                'name' => 'James & Chloe Wilson',
                'phone' => '+1 (555) 902-3312',
                'email' => 'wilson.home@example.com',
                'source' => 'Walk-in',
                'property_type' => 'House',
                'interested_property' => 'Maplewood Modern Townhouse',
                'preferred_location' => 'West End Park',
                'budget' => '$520,000',
                'status' => 'contacted',
                'priority' => 'low',
                'follow_up_date' => $yesterday, // Overdue follow-up for demonstration
                'notes' => [
                    'Walked into office Sunday afternoon. Sent email brochure of 3 alternative houses in the district.',
                ],
            ],
        ];

        foreach ($demoLeads as $leadData) {
            $notes = $leadData['notes'];
            unset($leadData['notes']);

            $lead = $agent->leads()->create($leadData);

            // Lead created activity
            LeadActivity::create([
                'lead_id' => $lead->id,
                'agent_id' => $agent->id,
                'activity_type' => 'lead_created',
                'description' => "Lead '{$lead->name}' was added to CRM",
                'new_value' => $lead->status,
                'created_at' => now()->subDays(rand(2, 5)),
            ]);

            // Add notes & note activities
            foreach ($notes as $noteText) {
                LeadNote::create([
                    'lead_id' => $lead->id,
                    'agent_id' => $agent->id,
                    'note' => $noteText,
                    'created_at' => now()->subHours(rand(3, 24)),
                ]);

                LeadActivity::create([
                    'lead_id' => $lead->id,
                    'agent_id' => $agent->id,
                    'activity_type' => 'note_added',
                    'description' => 'Note added: '.substr($noteText, 0, 75).'...',
                    'created_at' => now()->subHours(rand(2, 23)),
                ]);
            }

            if ($lead->status !== 'new') {
                LeadActivity::create([
                    'lead_id' => $lead->id,
                    'agent_id' => $agent->id,
                    'activity_type' => 'status_changed',
                    'description' => "Status progressed to '{$lead->status}'",
                    'old_value' => 'new',
                    'new_value' => $lead->status,
                    'created_at' => now()->subHours(rand(1, 12)),
                ]);
            }
        }

        return count($demoLeads);
    }

    private function clearAdminCache(): void
    {
        Cache::forget('admin_dashboard_stats');
        Cache::forget('admin_recent_agents');
    }
}
