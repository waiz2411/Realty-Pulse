<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    /**
     * Complete admin dashboard overview in a single network request
     */
    public function overview(): JsonResponse
    {
        $stats = $this->getStatsData();
        $recentAgents = $this->getRecentAgentsData();
        $recentLeads = $this->getRecentLeadsData();

        return response()->json([
            'stats' => $stats,
            'recent_agents' => $recentAgents,
            'recent_leads' => $recentLeads,
        ]);
    }

    /**
     * Get platform overview stats & analytics
     */
    public function stats(): JsonResponse
    {
        return response()->json($this->getStatsData());
    }

    /**
     * Recent agents for admin dashboard
     */
    public function recentAgents(): JsonResponse
    {
        return response()->json($this->getRecentAgentsData());
    }

    /**
     * Recent platform leads for admin dashboard
     */
    public function recentLeads(): JsonResponse
    {
        return response()->json($this->getRecentLeadsData());
    }

    /**
     * Helper to get stats data with smart caching
     */
    private function getStatsData(): array
    {
        return Cache::remember('admin_dashboard_stats', 20, function () {
            $today = now()->toDateString();

            // Consolidated Agent counts in 1 single query
            $agentStats = DB::table('users')
                ->where('role', 'agent')
                ->selectRaw("
                    COUNT(*) as total_agents,
                    SUM(CASE WHEN account_status = 'active' THEN 1 ELSE 0 END) as active_agents,
                    SUM(CASE WHEN account_status = 'suspended' THEN 1 ELSE 0 END) as suspended_agents,
                    SUM(CASE WHEN subscription_status = 'active' AND (subscription_expiry_date IS NULL OR subscription_expiry_date >= ?) THEN 1 ELSE 0 END) as active_subscriptions,
                    SUM(CASE WHEN subscription_status = 'expired' OR (subscription_expiry_date IS NOT NULL AND subscription_expiry_date < ?) THEN 1 ELSE 0 END) as expired_subscriptions
                ", [$today, $today])
                ->first();

            // Consolidated Lead counts in 1 single query
            $leadStats = DB::table('leads')
                ->selectRaw("
                    COUNT(*) as total_leads,
                    SUM(CASE WHEN DATE(created_at) = ? THEN 1 ELSE 0 END) as leads_added_today
                ", [$today])
                ->first();

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

            return [
                'overview' => [
                    'total_agents' => (int) ($agentStats->total_agents ?? 0),
                    'active_agents' => (int) ($agentStats->active_agents ?? 0),
                    'suspended_agents' => (int) ($agentStats->suspended_agents ?? 0),
                    'total_leads' => (int) ($leadStats->total_leads ?? 0),
                    'leads_added_today' => (int) ($leadStats->leads_added_today ?? 0),
                    'active_subscriptions' => (int) ($agentStats->active_subscriptions ?? 0),
                    'expired_subscriptions' => (int) ($agentStats->expired_subscriptions ?? 0),
                ],
                'analytics' => [
                    'leads_by_status' => $leadsByStatus,
                    'top_agents' => $topAgents,
                ],
            ];
        });
    }

    private function getRecentAgentsData()
    {
        return Cache::remember('admin_recent_agents', 20, function () {
            return User::where('role', 'agent')
                ->withCount('leads')
                ->latest()
                ->limit(5)
                ->get();
        });
    }

    private function getRecentLeadsData()
    {
        return Cache::remember('admin_recent_leads', 20, function () {
            return Lead::with('agent:id,name,email,phone')
                ->latest()
                ->limit(10)
                ->get();
        });
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
