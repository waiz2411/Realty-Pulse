<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * User Login
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        try {
            $user = User::where('email', $request->email)->first();
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Database connection failed: ' . $e->getMessage(),
                'error_type' => 'DATABASE_ERROR',
                'hint' => 'Check your DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD environment variables on Render. If using Hostinger, ensure you entered the Remote MySQL Server IP and imported database.sql.',
            ], 500);
        }

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        // Update last login timestamp
        $user->forceFill([
            'last_login_at' => now(),
        ])->save();

        // Generate Sanctum token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Logged in successfully',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'account_status' => $user->account_status,
                'subscription_plan' => $user->subscription_plan,
                'subscription_status' => $user->subscription_status,
                'subscription_start_date' => $user->subscription_start_date?->format('Y-m-d'),
                'subscription_expiry_date' => $user->subscription_expiry_date?->format('Y-m-d'),
                'is_blocked' => ! $user->isAdmin() && (! $user->isActive() || ! $user->hasActiveSubscription()),
                'last_login_at' => $user->last_login_at?->toIso8601String(),
                'created_at' => $user->created_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get Current Authenticated User Info
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'account_status' => $user->account_status,
                'subscription_plan' => $user->subscription_plan,
                'subscription_status' => $user->subscription_status,
                'subscription_start_date' => $user->subscription_start_date?->format('Y-m-d'),
                'subscription_expiry_date' => $user->subscription_expiry_date?->format('Y-m-d'),
                'is_blocked' => ! $user->isAdmin() && (! $user->isActive() || ! $user->hasActiveSubscription()),
                'last_login_at' => $user->last_login_at?->toIso8601String(),
                'created_at' => $user->created_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * User Logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Update Profile (Name & Phone)
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:30',
        ]);

        $user->update([
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
        ]);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'account_status' => $user->account_status,
                'subscription_plan' => $user->subscription_plan,
                'subscription_status' => $user->subscription_status,
                'subscription_start_date' => $user->subscription_start_date?->format('Y-m-d'),
                'subscription_expiry_date' => $user->subscription_expiry_date?->format('Y-m-d'),
                'is_blocked' => ! $user->isAdmin() && (! $user->isActive() || ! $user->hasActiveSubscription()),
            ],
        ]);
    }

    /**
     * Change Password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided current password does not match our records.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'message' => 'Password changed successfully',
        ]);
    }
}
