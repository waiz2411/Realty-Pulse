<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadActivity;
use App\Models\LeadNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AgentLeadController extends Controller
{
    /**
     * List leads with filtering, search, and pagination
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->leads()->latest();

        // Search by name, phone, email, property
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('interested_property', 'like', "%{$search}%")
                  ->orWhere('preferred_location', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        // Filter by source
        if ($source = $request->query('source')) {
            $query->where('source', $source);
        }

        // Filter by property type
        if ($propertyType = $request->query('property_type')) {
            $query->where('property_type', $propertyType);
        }

        // Filter by priority
        if ($priority = $request->query('priority')) {
            $query->where('priority', $priority);
        }

        // Filter by follow-up timing
        if ($followUp = $request->query('follow_up')) {
            $today = now()->toDateString();
            if ($followUp === 'today') {
                $query->whereDate('follow_up_date', $today);
            } elseif ($followUp === 'overdue') {
                $query->where('follow_up_date', '<', $today)
                      ->whereNotIn('status', ['won', 'lost']);
            } elseif ($followUp === 'upcoming') {
                $query->where('follow_up_date', '>', $today);
            }
        }

        $perPage = (int) $request->query('per_page', 10);
        $leads = $query->paginate($perPage);

        return response()->json($leads);
    }

    /**
     * Store new lead
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:40',
            'email' => 'nullable|email|max:255',
            'source' => ['nullable', 'string', 'max:100'],
            'property_type' => ['nullable', 'string', 'max:100'],
            'interested_property' => 'nullable|string|max:255',
            'preferred_location' => 'nullable|string|max:255',
            'budget' => 'nullable|string|max:100',
            'status' => ['nullable', Rule::in(['new', 'contacted', 'qualified', 'site_visit_scheduled', 'negotiation', 'won', 'lost'])],
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high'])],
            'follow_up_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $lead = $request->user()->leads()->create([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'source' => $validated['source'] ?? 'Website',
            'property_type' => $validated['property_type'] ?? 'Apartment',
            'interested_property' => $validated['interested_property'] ?? null,
            'preferred_location' => $validated['preferred_location'] ?? null,
            'budget' => $validated['budget'] ?? null,
            'status' => $validated['status'] ?? 'new',
            'priority' => $validated['priority'] ?? 'medium',
            'follow_up_date' => $validated['follow_up_date'] ?? null,
        ]);

        // Record creation activity
        LeadActivity::create([
            'lead_id' => $lead->id,
            'agent_id' => $request->user()->id,
            'activity_type' => 'lead_created',
            'description' => "Lead '{$lead->name}' was added to CRM",
            'new_value' => $lead->status,
        ]);

        // If an initial note was supplied, create it
        if (! empty($validated['notes'])) {
            $note = LeadNote::create([
                'lead_id' => $lead->id,
                'agent_id' => $request->user()->id,
                'note' => $validated['notes'],
            ]);

            LeadActivity::create([
                'lead_id' => $lead->id,
                'agent_id' => $request->user()->id,
                'activity_type' => 'note_added',
                'description' => 'Initial note added: '.substr($validated['notes'], 0, 80),
            ]);
        }

        $this->clearDashboardCache($lead->agent_id);

        return response()->json([
            'message' => 'Lead created successfully',
            'lead' => $lead->load(['notes', 'activities']),
        ], 201);
    }

    /**
     * Show single lead with activity timeline and notes
     */
    public function show(Request $request, $id): JsonResponse
    {
        // Enforce tenant isolation: user can only view their own lead unless super admin
        $user = $request->user();

        $query = Lead::with(['notes', 'activities']);
        if (! $user->isAdmin()) {
            $query->where('agent_id', $user->id);
        }

        $lead = $query->findOrFail($id);

        return response()->json([
            'lead' => $lead,
        ]);
    }

    /**
     * Update lead
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $query = Lead::query();
        if (! $user->isAdmin()) {
            $query->where('agent_id', $user->id);
        }
        $lead = $query->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:40',
            'email' => 'nullable|email|max:255',
            'source' => ['nullable', 'string', 'max:100'],
            'property_type' => ['nullable', 'string', 'max:100'],
            'interested_property' => 'nullable|string|max:255',
            'preferred_location' => 'nullable|string|max:255',
            'budget' => 'nullable|string|max:100',
            'status' => ['required', Rule::in(['new', 'contacted', 'qualified', 'site_visit_scheduled', 'negotiation', 'won', 'lost'])],
            'priority' => ['required', Rule::in(['low', 'medium', 'high'])],
            'follow_up_date' => 'nullable|date',
        ]);

        $oldStatus = $lead->status;
        $oldFollowUp = $lead->follow_up_date?->format('Y-m-d');

        $lead->update($validated);

        // Check if status changed
        if ($oldStatus !== $lead->status) {
            LeadActivity::create([
                'lead_id' => $lead->id,
                'agent_id' => $user->id,
                'activity_type' => 'status_changed',
                'description' => "Status changed from '{$oldStatus}' to '{$lead->status}'",
                'old_value' => $oldStatus,
                'new_value' => $lead->status,
            ]);
        }

        // Check if follow up date changed
        $newFollowUp = $lead->follow_up_date?->format('Y-m-d');
        if ($oldFollowUp !== $newFollowUp) {
            LeadActivity::create([
                'lead_id' => $lead->id,
                'agent_id' => $user->id,
                'activity_type' => 'follow_up_date_changed',
                'description' => "Follow-up date updated to ".($newFollowUp ?: 'None'),
                'old_value' => $oldFollowUp,
                'new_value' => $newFollowUp,
            ]);
        }

        // General update activity
        LeadActivity::create([
            'lead_id' => $lead->id,
            'agent_id' => $user->id,
            'activity_type' => 'lead_updated',
            'description' => 'Lead details were updated',
        ]);

        $this->clearDashboardCache($lead->agent_id);

        return response()->json([
            'message' => 'Lead updated successfully',
            'lead' => $lead->fresh()->load(['notes', 'activities']),
        ]);
    }

    /**
     * Quick status update
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $query = Lead::query();
        if (! $user->isAdmin()) {
            $query->where('agent_id', $user->id);
        }
        $lead = $query->findOrFail($id);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['new', 'contacted', 'qualified', 'site_visit_scheduled', 'negotiation', 'won', 'lost'])],
        ]);

        $oldStatus = $lead->status;
        $newStatus = $validated['status'];

        $lead->update(['status' => $newStatus]);

        LeadActivity::create([
            'lead_id' => $lead->id,
            'agent_id' => $user->id,
            'activity_type' => 'status_changed',
            'description' => "Status updated to '{$newStatus}'",
            'old_value' => $oldStatus,
            'new_value' => $newStatus,
        ]);

        $this->clearDashboardCache($lead->agent_id);

        return response()->json([
            'message' => 'Lead status updated successfully',
            'lead' => $lead->fresh()->load(['notes', 'activities']),
        ]);
    }

    /**
     * Add note to a lead
     */
    public function addNote(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $query = Lead::query();
        if (! $user->isAdmin()) {
            $query->where('agent_id', $user->id);
        }
        $lead = $query->findOrFail($id);

        $validated = $request->validate([
            'note' => 'required|string|max:5000',
        ]);

        $note = LeadNote::create([
            'lead_id' => $lead->id,
            'agent_id' => $user->id,
            'note' => $validated['note'],
        ]);

        LeadActivity::create([
            'lead_id' => $lead->id,
            'agent_id' => $user->id,
            'activity_type' => 'note_added',
            'description' => 'Note added: '.substr($validated['note'], 0, 80),
        ]);

        return response()->json([
            'message' => 'Note added successfully',
            'note' => $note,
            'lead' => $lead->fresh()->load(['notes', 'activities']),
        ], 201);
    }

    /**
     * Grouped follow-ups (Overdue, Today, Upcoming)
     */
    public function followUps(Request $request): JsonResponse
    {
        $agent = $request->user();
        $today = now()->toDateString();

        $overdue = $agent->leads()
            ->whereNotNull('follow_up_date')
            ->where('follow_up_date', '<', $today)
            ->whereNotIn('status', ['won', 'lost'])
            ->orderBy('follow_up_date', 'asc')
            ->get();

        $todayLeads = $agent->leads()
            ->whereDate('follow_up_date', $today)
            ->orderBy('priority', 'desc')
            ->get();

        $upcoming = $agent->leads()
            ->where('follow_up_date', '>', $today)
            ->orderBy('follow_up_date', 'asc')
            ->get();

        return response()->json([
            'overdue' => $overdue,
            'today' => $todayLeads,
            'upcoming' => $upcoming,
            'counts' => [
                'overdue' => $overdue->count(),
                'today' => $todayLeads->count(),
                'upcoming' => $upcoming->count(),
            ],
        ]);
    }

    /**
     * Mark follow-up as completed or reschedule
     */
    public function completeFollowUp(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $query = Lead::query();
        if (! $user->isAdmin()) {
            $query->where('agent_id', $user->id);
        }
        $lead = $query->findOrFail($id);

        $validated = $request->validate([
            'next_follow_up_date' => 'nullable|date',
            'note' => 'nullable|string',
            'status' => ['nullable', Rule::in(['new', 'contacted', 'qualified', 'site_visit_scheduled', 'negotiation', 'won', 'lost'])],
        ]);

        $oldDate = $lead->follow_up_date?->format('Y-m-d');
        $newDate = $validated['next_follow_up_date'] ?? null;

        $updateData = ['follow_up_date' => $newDate];
        if (! empty($validated['status'])) {
            $updateData['status'] = $validated['status'];
        }
        $lead->update($updateData);

        if (! empty($validated['note'])) {
            LeadNote::create([
                'lead_id' => $lead->id,
                'agent_id' => $user->id,
                'note' => $validated['note'],
            ]);
        }

        LeadActivity::create([
            'lead_id' => $lead->id,
            'agent_id' => $user->id,
            'activity_type' => 'follow_up_date_changed',
            'description' => $newDate ? "Follow-up marked completed and rescheduled to {$newDate}" : "Follow-up marked completed",
            'old_value' => $oldDate,
            'new_value' => $newDate,
        ]);

        $this->clearDashboardCache($lead->agent_id);

        return response()->json([
            'message' => 'Follow-up updated successfully',
            'lead' => $lead->fresh()->load(['notes', 'activities']),
        ]);
    }

    /**
     * Delete lead
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $query = Lead::query();
        if (! $user->isAdmin()) {
            $query->where('agent_id', $user->id);
        }
        $lead = $query->findOrFail($id);

        $leadName = $lead->name;
        $agentId = $lead->agent_id;
        $lead->delete();

        $this->clearDashboardCache($agentId);

        return response()->json([
            'message' => "Lead '{$leadName}' has been deleted successfully",
        ]);
    }

    private function clearDashboardCache($agentId): void
    {
        \Illuminate\Support\Facades\Cache::forget("agent_stats_{$agentId}");
        \Illuminate\Support\Facades\Cache::forget('admin_dashboard_stats');
        \Illuminate\Support\Facades\Cache::forget('admin_recent_leads');
    }
}
