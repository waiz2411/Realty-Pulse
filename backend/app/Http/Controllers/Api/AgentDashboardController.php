<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgentDashboardController extends Controller
{
    /**
     * Agent dashboard overview stats
     */
    public function stats(Request $request): JsonResponse
    {
        $agent = $request->user();
        $today = now()->toDateString();

        $leadsQuery = $agent->leads();

        $stats = [
            'total_leads' => (clone $leadsQuery)->count(),
            'new_leads' => (clone $leadsQuery)->where('status', 'new')->count(),
            'contacted_leads' => (clone $leadsQuery)->where('status', 'contacted')->count(),
            'qualified_leads' => (clone $leadsQuery)->where('status', 'qualified')->count(),
            'site_visit_scheduled' => (clone $leadsQuery)->where('status', 'site_visit_scheduled')->count(),
            'negotiation_leads' => (clone $leadsQuery)->where('status', 'negotiation')->count(),
            'closed_deals' => (clone $leadsQuery)->where('status', 'won')->count(),
            'lost_leads' => (clone $leadsQuery)->where('status', 'lost')->count(),
            'followups_today' => (clone $leadsQuery)->whereDate('follow_up_date', $today)->count(),
            'followups_overdue' => (clone $leadsQuery)
                ->where('follow_up_date', '<', $today)
                ->whereNotIn('status', ['won', 'lost'])
                ->count(),
        ];

        return response()->json($stats);
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
}
