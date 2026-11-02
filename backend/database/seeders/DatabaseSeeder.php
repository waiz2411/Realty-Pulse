<?php

namespace Database\Seeders;

use App\Models\Lead;
use App\Models\LeadActivity;
use App\Models\LeadNote;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Super Admin
        $admin = User::create([
            'name' => 'Platform Super Admin',
            'email' => 'admin@realestatecrm.com',
            'phone' => '+1 (555) 019-2831',
            'password' => Hash::make('Password123!'),
            'role' => 'admin',
            'account_status' => 'active',
            'subscription_plan' => 'pro',
            'subscription_status' => 'active',
            'subscription_start_date' => now()->subMonths(6)->toDateString(),
            'subscription_expiry_date' => now()->addYears(2)->toDateString(),
            'last_login_at' => now()->subMinutes(15),
        ]);

        // 2. Active Pro Agent: Sarah Jenkins
        $sarah = User::create([
            'name' => 'Sarah Jenkins',
            'email' => 'sarah@realty.com',
            'phone' => '+1 (555) 234-5678',
            'password' => Hash::make('Password123!'),
            'role' => 'agent',
            'account_status' => 'active',
            'subscription_plan' => 'pro',
            'subscription_status' => 'active',
            'subscription_start_date' => now()->subMonths(3)->toDateString(),
            'subscription_expiry_date' => now()->addMonths(9)->toDateString(),
            'last_login_at' => now()->subHours(2),
        ]);

        // 3. Active Basic Agent: David Chen
        $david = User::create([
            'name' => 'David Chen',
            'email' => 'david@realty.com',
            'phone' => '+1 (555) 345-6789',
            'password' => Hash::make('Password123!'),
            'role' => 'agent',
            'account_status' => 'active',
            'subscription_plan' => 'basic',
            'subscription_status' => 'active',
            'subscription_start_date' => now()->subMonths(1)->toDateString(),
            'subscription_expiry_date' => now()->addMonths(2)->toDateString(),
            'last_login_at' => now()->subDays(1),
        ]);

        // 4. Suspended Agent: Elena Rostova (For testing suspension enforcement)
        $elena = User::create([
            'name' => 'Elena Rostova',
            'email' => 'elena@realty.com',
            'phone' => '+1 (555) 456-7890',
            'password' => Hash::make('Password123!'),
            'role' => 'agent',
            'account_status' => 'suspended',
            'subscription_plan' => 'basic',
            'subscription_status' => 'active',
            'subscription_start_date' => now()->subMonths(2)->toDateString(),
            'subscription_expiry_date' => now()->addMonths(4)->toDateString(),
            'last_login_at' => now()->subDays(5),
        ]);

        // 5. Expired Subscription Agent: Marcus Sterling (For testing expired subscription enforcement)
        $marcus = User::create([
            'name' => 'Marcus Sterling',
            'email' => 'marcus@realty.com',
            'phone' => '+1 (555) 567-8901',
            'password' => Hash::make('Password123!'),
            'role' => 'agent',
            'account_status' => 'active',
            'subscription_plan' => 'free',
            'subscription_status' => 'expired',
            'subscription_start_date' => now()->subMonths(2)->toDateString(),
            'subscription_expiry_date' => now()->subDays(5)->toDateString(), // expired
            'last_login_at' => now()->subDays(3),
        ]);

        // 6. Realistic Leads for Sarah Jenkins
        $sarahLeads = [
            [
                'name' => 'Michael Vance',
                'phone' => '+1 (555) 789-0123',
                'email' => 'michael.vance@example.com',
                'source' => 'Facebook Ads',
                'property_type' => 'Apartment',
                'interested_property' => 'Skyline Penthouse 14B',
                'preferred_location' => 'Downtown Financial District',
                'budget' => '$750,000 - $850,000',
                'status' => 'site_visit_scheduled',
                'priority' => 'high',
                'follow_up_date' => now()->toDateString(), // Today!
                'notes' => [
                    'Client requested evening viewing for Friday.',
                    'Pre-approved for mortgage through Chase Bank.',
                ],
            ],
            [
                'name' => 'Amanda Rodriguez',
                'phone' => '+1 (555) 890-1234',
                'email' => 'amanda.r@example.com',
                'source' => 'Instagram',
                'property_type' => 'House',
                'interested_property' => '4-Bedroom Suburban Villa',
                'preferred_location' => 'Oakridge Heights',
                'budget' => '$1,200,000',
                'status' => 'negotiation',
                'priority' => 'high',
                'follow_up_date' => now()->toDateString(), // Today!
                'notes' => [
                    'Offered $1.15M; seller counter-offered at $1.18M.',
                    'Waiting on seller response by 5 PM.',
                ],
            ],
            [
                'name' => 'Robert Fox',
                'phone' => '+1 (555) 901-2345',
                'email' => 'rfox@example.com',
                'source' => 'Website',
                'property_type' => 'Commercial',
                'interested_property' => 'Tech Park Retail Space Unit 3',
                'preferred_location' => 'Innovation Boulevard',
                'budget' => '$550,000',
                'status' => 'qualified',
                'priority' => 'medium',
                'follow_up_date' => now()->addDays(2)->toDateString(), // Upcoming
                'notes' => [
                    'Looking for 1500 sqft for a specialty coffee shop.',
                ],
            ],
            [
                'name' => 'Sophia Martinez',
                'phone' => '+1 (555) 012-3456',
                'email' => 'sophia.m@example.com',
                'source' => 'WhatsApp',
                'property_type' => 'Plot',
                'interested_property' => 'Lakeview Residential Corner Lot',
                'preferred_location' => 'Emerald Lake Estates',
                'budget' => '$320,000',
                'status' => 'contacted',
                'priority' => 'low',
                'follow_up_date' => now()->subDays(2)->toDateString(), // Overdue!
                'notes' => [
                    'Sent master plan PDF via WhatsApp. Follow up on soil test report.',
                ],
            ],
            [
                'name' => 'Ethan Walker',
                'phone' => '+1 (555) 123-4567',
                'email' => 'ethan.w@example.com',
                'source' => 'Referral',
                'property_type' => 'Apartment',
                'interested_property' => '2-Bedroom Harbor View Suite',
                'preferred_location' => 'Marina Bay',
                'budget' => '$620,000',
                'status' => 'won',
                'priority' => 'high',
                'follow_up_date' => null,
                'notes' => [
                    'Contracts signed! Escrow deposit received.',
                ],
            ],
            [
                'name' => 'Jessica Taylor',
                'phone' => '+1 (555) 234-5670',
                'email' => 'jessica.t@example.com',
                'source' => 'Walk-in',
                'property_type' => 'House',
                'interested_property' => 'Modern Farmhouse with Garden',
                'preferred_location' => 'Meadowlands',
                'budget' => '$900,000',
                'status' => 'new',
                'priority' => 'medium',
                'follow_up_date' => now()->addDays(1)->toDateString(), // Upcoming
                'notes' => [
                    'Walked into office inquiring about school district ratings.',
                ],
            ],
            [
                'name' => 'Daniel Kim',
                'phone' => '+1 (555) 345-6781',
                'email' => 'daniel.kim@example.com',
                'source' => 'Property Portal',
                'property_type' => 'Office',
                'interested_property' => 'Floor 8 Corporate Suite',
                'preferred_location' => 'City Center',
                'budget' => '$1,500,000',
                'status' => 'lost',
                'priority' => 'low',
                'follow_up_date' => null,
                'notes' => [
                    'Client decided to lease instead of purchase.',
                ],
            ],
        ];

        foreach ($sarahLeads as $data) {
            $notes = $data['notes'];
            unset($data['notes']);

            $lead = $sarah->leads()->create($data);

            LeadActivity::create([
                'lead_id' => $lead->id,
                'agent_id' => $sarah->id,
                'activity_type' => 'lead_created',
                'description' => "Lead '{$lead->name}' was added to CRM",
                'new_value' => $lead->status,
                'created_at' => now()->subDays(rand(2, 10)),
            ]);

            foreach ($notes as $index => $noteText) {
                LeadNote::create([
                    'lead_id' => $lead->id,
                    'agent_id' => $sarah->id,
                    'note' => $noteText,
                    'created_at' => now()->subHours(rand(1, 24)),
                ]);

                LeadActivity::create([
                    'lead_id' => $lead->id,
                    'agent_id' => $sarah->id,
                    'activity_type' => 'note_added',
                    'description' => 'Note added: '.substr($noteText, 0, 80),
                    'created_at' => now()->subHours(rand(1, 24)),
                ]);
            }
        }

        // 7. Realistic Leads for David Chen
        $davidLeads = [
            [
                'name' => 'Bradley Cooper',
                'phone' => '+1 (555) 456-7892',
                'email' => 'bradley.c@example.com',
                'source' => 'Phone Call',
                'property_type' => 'Apartment',
                'interested_property' => 'Cedar Court Studio 3A',
                'preferred_location' => 'West End',
                'budget' => '$380,000',
                'status' => 'new',
                'priority' => 'medium',
                'follow_up_date' => now()->toDateString(),
            ],
            [
                'name' => 'Victoria Bennett',
                'phone' => '+1 (555) 567-8903',
                'email' => 'v.bennett@example.com',
                'source' => 'Facebook Ads',
                'property_type' => 'House',
                'interested_property' => 'Pinecrest Family Residence',
                'preferred_location' => 'Greenhill Valley',
                'budget' => '$820,000',
                'status' => 'contacted',
                'priority' => 'high',
                'follow_up_date' => now()->addDays(3)->toDateString(),
            ],
            [
                'name' => 'Gregory House',
                'phone' => '+1 (555) 678-9014',
                'email' => 'greg.h@example.com',
                'source' => 'Website',
                'property_type' => 'Commercial',
                'interested_property' => 'Medical Clinic Ground Floor',
                'preferred_location' => 'Healthcare Plaza',
                'budget' => '$1,100,000',
                'status' => 'won',
                'priority' => 'high',
                'follow_up_date' => null,
            ],
        ];

        foreach ($davidLeads as $data) {
            $lead = $david->leads()->create($data);
            LeadActivity::create([
                'lead_id' => $lead->id,
                'agent_id' => $david->id,
                'activity_type' => 'lead_created',
                'description' => "Lead '{$lead->name}' was added to CRM",
                'new_value' => $lead->status,
                'created_at' => now()->subDays(rand(1, 5)),
            ]);
            LeadNote::create([
                'lead_id' => $lead->id,
                'agent_id' => $david->id,
                'note' => 'Client contacted via lead capture form.',
                'created_at' => now()->subDays(1),
            ]);
        }

        // 8. Lead for suspended agent Elena (to verify data remains safe)
        $elenaLead = $elena->leads()->create([
            'name' => 'Lucas Wright',
            'phone' => '+1 (555) 789-0125',
            'email' => 'lucas.w@example.com',
            'source' => 'Referral',
            'property_type' => 'Apartment',
            'interested_property' => 'Sunset Towers 9D',
            'preferred_location' => 'Uptown',
            'budget' => '$450,000',
            'status' => 'qualified',
            'priority' => 'medium',
            'follow_up_date' => now()->addDays(4)->toDateString(),
        ]);
        LeadActivity::create([
            'lead_id' => $elenaLead->id,
            'agent_id' => $elena->id,
            'activity_type' => 'lead_created',
            'description' => "Lead 'Lucas Wright' was added to CRM",
            'new_value' => 'qualified',
        ]);
    }
}
