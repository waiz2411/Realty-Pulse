<?php

use App\Http\Controllers\Api\AdminAgentController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AgentDashboardController;
use App\Http\Controllers\Api\AgentLeadController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// Public Routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// Authenticated Routes
Route::middleware('auth:sanctum')->group(function () {
    // Current user profile & session
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });

    // Super Admin Only Routes
    Route::middleware('admin')->prefix('admin')->group(function () {
        // Admin Dashboard & Analytics
        Route::get('/dashboard/stats', [AdminDashboardController::class, 'stats']);
        Route::get('/dashboard/recent-agents', [AdminDashboardController::class, 'recentAgents']);
        Route::get('/dashboard/recent-leads', [AdminDashboardController::class, 'recentLeads']);
        Route::get('/leads', [AdminDashboardController::class, 'allLeads']);

        // Agent Management CRUD
        Route::get('/agents', [AdminAgentController::class, 'index']);
        Route::post('/agents', [AdminAgentController::class, 'store']);
        Route::get('/agents/{id}', [AdminAgentController::class, 'show']);
        Route::put('/agents/{id}', [AdminAgentController::class, 'update']);
        Route::patch('/agents/{id}/status', [AdminAgentController::class, 'updateStatus']);
        Route::post('/agents/{id}/reset-password', [AdminAgentController::class, 'resetPassword']);
        Route::delete('/agents/{id}', [AdminAgentController::class, 'destroy']);
    });

    // Agent Protected Routes (Guarded by subscription & active status check)
    Route::middleware('agent.active')->prefix('agent')->group(function () {
        // Dashboard
        Route::get('/dashboard/stats', [AgentDashboardController::class, 'stats']);
        Route::get('/dashboard/recent-leads', [AgentDashboardController::class, 'recentLeads']);
        Route::get('/dashboard/today-followups', [AgentDashboardController::class, 'todayFollowUps']);
        Route::get('/dashboard/upcoming-followups', [AgentDashboardController::class, 'upcomingFollowUps']);

        // Leads CRUD & Details
        Route::get('/leads', [AgentLeadController::class, 'index']);
        Route::post('/leads', [AgentLeadController::class, 'store']);
        Route::get('/leads/{id}', [AgentLeadController::class, 'show']);
        Route::put('/leads/{id}', [AgentLeadController::class, 'update']);
        Route::patch('/leads/{id}/status', [AgentLeadController::class, 'updateStatus']);
        Route::post('/leads/{id}/notes', [AgentLeadController::class, 'addNote']);
        Route::delete('/leads/{id}', [AgentLeadController::class, 'destroy']);

        // Follow-ups
        Route::get('/followups', [AgentLeadController::class, 'followUps']);
        Route::post('/leads/{id}/complete-followup', [AgentLeadController::class, 'completeFollowUp']);
    });
});
