<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    /**
     * Get platform overview stats & analytics
     */
    public function stats(): JsonResponse
    {
        $today = now()->toDateString();

        $totalAgents = User::where('role', 'agent')->count();
        $activeAgents = User::where('role', 'agent')->where('account_status', 'active')->count();
        $suspendedAgents = User::where('role', 'agent')->where('account_status', 'suspended')->count();

        $totalLeads = Lead::count();
        $leadsToday = Lead::whereDate('created_at', $today)->count();

        $activeSubscriptions = User::where('role', 'agent')
            ->where('subscription_status', 'active')
            ->where(function ($q) use ($today) {
                $q->whereNull('subscription_expiry_date')
                  ->orWhere('subscription_expiry_date', '>=', $today);
            })
            ->count();

        $expiredSubscriptions = User::where('role', 'agent')
            ->where(function ($q) use ($today) {
                $q->where('subscription_status', 'expired')
                  ->orWhere(function ($sub) use ($today) {
                      $sub->whereNotNull('subscription_expiry_date')
                          ->where('subscription_expiry_date', '<', $today);
                  });
            })
            ->count();

        // Leads by status breakdown
        $leadsByStatus = Lead::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Top 5 agents by lead count
        $topAgents = User::where('role', 'agent')
            ->withCount('leads')
            ->orderByDesc('leads_count')
            ->limit(5)
            ->get(['id', 'name', 'email', 'account_status', 'leads_count']);

        return response()->json([
            'overview' => [
                'total_agents' => $totalAgents,
                'active_agents' => $activeAgents,
                'suspended_agents' => $suspendedAgents,
                'total_leads' => $totalLeads,
                'leads_added_today' => $leadsToday,
                'active_subscriptions' => $activeSubscriptions,
                'expired_subscriptions' => $expiredSubscriptions,
            ],
            'analytics' => [
                'leads_by_status' => $leadsByStatus,
                'top_agents' => $topAgents,
            ],
        ]);
    }

    /**
     * Recent agents for admin dashboard
     */
    public function recentAgents(): JsonResponse
    {
        $agents = User::where('role', 'agent')
            ->withCount('leads')
            ->latest()
            ->limit(5)
            ->get();

        return response()->json($agents);
    }

    /**
     * Recent platform leads for admin dashboard
     */
    public function recentLeads(): JsonResponse
    {
        $leads = Lead::with('agent:id,name,email,phone')
            ->latest()
            ->limit(10)
            ->get();

        return response()->json($leads);
    }

    /**
     * All leads across platform with search and filtering
     */
    public function allLeads(Request $request): JsonResponse
    {
        $query = Lead::with('agent:id,name,email,phone')
            ->latest();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('interested_property', 'like', "%{$search}%")
                  ->orWhereHas('agent', function ($agentQuery) use ($search) {
                      $agentQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($agentId = $request->query('agent_id')) {
            $query->where('agent_id', $agentId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($priority = $request->query('priority')) {
            $query->where('priority', $priority);
        }

        if ($source = $request->query('source')) {
            $query->where('source', $source);
        }

        $perPage = (int) $request->query('per_page', 10);
        $leads = $query->paginate($perPage);

        return response()->json($leads);
    }
}
