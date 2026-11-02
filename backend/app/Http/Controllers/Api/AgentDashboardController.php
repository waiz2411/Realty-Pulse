<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AgentDashboardController extends Controller
{
    /**
     * Complete agent dashboard overview in a single network request
     */
    public function overview(Request $request): JsonResponse
    {
        $agent = $request->user();
        $today = now()->toDateString();

        $stats = $this->getStatsData($agent);

        $recentLeads = $agent->leads()
            ->latest()
            ->limit(5)
            ->get();

        $todayFollowUps = $agent->leads()
            ->whereDate('follow_up_date', $today)
            ->orderBy('priority', 'desc')
            ->get();

        $upcomingFollowUps = $agent->leads()
            ->where('follow_up_date', '>', $today)
            ->orderBy('follow_up_date', 'asc')
            ->limit(10)
            ->get();

        return response()->json([
            'stats' => $stats,
            'recent_leads' => $recentLeads,
            'today_followups' => $todayFollowUps,
            'upcoming_followups' => $upcomingFollowUps,
        ]);
    }

    /**
     * Agent dashboard overview stats
     */
    public function stats(Request $request): JsonResponse
    {
        return response()->json($this->getStatsData($request->user()));
    }

    /**
     * Agent recent leads
     */
    public function recentLeads(Request $request): JsonResponse
    {
        $leads = $request->user()->leads()
            ->latest()
            ->limit(5)
            ->get();

        return response()->json($leads);
    }

    /**
     * Leads needing follow-up today
     */
    public function todayFollowUps(Request $request): JsonResponse
    {
        $today = now()->toDateString();

        $leads = $request->user()->leads()
            ->whereDate('follow_up_date', $today)
            ->orderBy('priority', 'desc')
            ->get();

        return response()->json($leads);
    }

    /**
     * Upcoming follow-up leads
     */
    public function upcomingFollowUps(Request $request): JsonResponse
    {
        $today = now()->toDateString();

        $leads = $request->user()->leads()
            ->where('follow_up_date', '>', $today)
            ->orderBy('follow_up_date', 'asc')
            ->limit(10)
            ->get();

        return response()->json($leads);
    }

    /**
     * Helper to compute all 10 stats in 1 single SQL query with smart caching
     */
    private function getStatsData($agent): array
    {
        $cacheKey = "agent_stats_{$agent->id}";

        return Cache::remember($cacheKey, 20, function () use ($agent) {
            $today = now()->toDateString();

            $row = DB::table('leads')
                ->where('agent_id', $agent->id)
                ->selectRaw("
                    COUNT(*) as total_leads,
                    SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_leads,
                    SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted_leads,
                    SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) as qualified_leads,
                    SUM(CASE WHEN status = 'site_visit_scheduled' THEN 1 ELSE 0 END) as site_visit_scheduled,
                    SUM(CASE WHEN status = 'negotiation' THEN 1 ELSE 0 END) as negotiation_leads,
                    SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as closed_deals,
                    SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost_leads,
                    SUM(CASE WHEN follow_up_date = ? THEN 1 ELSE 0 END) as followups_today,
                    SUM(CASE WHEN follow_up_date < ? AND status NOT IN ('won', 'lost') THEN 1 ELSE 0 END) as followups_overdue
                ", [$today, $today])
                ->first();

            return [
                'total_leads' => (int) ($row->total_leads ?? 0),
                'new_leads' => (int) ($row->new_leads ?? 0),
                'contacted_leads' => (int) ($row->contacted_leads ?? 0),
                'qualified_leads' => (int) ($row->qualified_leads ?? 0),
                'site_visit_scheduled' => (int) ($row->site_visit_scheduled ?? 0),
                'negotiation_leads' => (int) ($row->negotiation_leads ?? 0),
                'closed_deals' => (int) ($row->closed_deals ?? 0),
                'lost_leads' => (int) ($row->lost_leads ?? 0),
                'followups_today' => (int) ($row->followups_today ?? 0),
                'followups_overdue' => (int) ($row->followups_overdue ?? 0),
            ];
        });
    }
}
