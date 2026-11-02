<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAgentNotBlocked
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Super Admin is never blocked
        if ($user->isAdmin()) {
            return $next($request);
        }

        // Check if account is suspended or inactive
        if ($user->account_status === 'suspended') {
            return response()->json([
                'message' => 'Your agent account has been suspended by the platform administrator.',
                'error_code' => 'ACCOUNT_SUSPENDED',
                'account_status' => $user->account_status,
                'subscription_status' => $user->subscription_status,
                'subscription_plan' => $user->subscription_plan,
                'subscription_expiry_date' => $user->subscription_expiry_date?->format('Y-m-d'),
            ], 403);
        }

        if ($user->account_status === 'inactive') {
            return response()->json([
                'message' => 'Your agent account is currently inactive.',
                'error_code' => 'ACCOUNT_INACTIVE',
                'account_status' => $user->account_status,
                'subscription_status' => $user->subscription_status,
                'subscription_plan' => $user->subscription_plan,
                'subscription_expiry_date' => $user->subscription_expiry_date?->format('Y-m-d'),
            ], 403);
        }

        // Check subscription status
        if (! $user->hasActiveSubscription()) {
            return response()->json([
                'message' => 'Your subscription has expired or is inactive. Please contact the administrator to renew your plan.',
                'error_code' => 'SUBSCRIPTION_EXPIRED',
                'account_status' => $user->account_status,
                'subscription_status' => $user->subscription_status,
                'subscription_plan' => $user->subscription_plan,
                'subscription_expiry_date' => $user->subscription_expiry_date?->format('Y-m-d'),
            ], 403);
        }

        return $next($request);
    }
}
