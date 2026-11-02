<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    use HasFactory;

    protected $fillable = [
        'agent_id',
        'name',
        'phone',
        'email',
        'source',
        'property_type',
        'interested_property',
        'preferred_location',
        'budget',
        'status',
        'priority',
        'follow_up_date',
    ];

    protected function casts(): array
    {
        return [
            'follow_up_date' => 'date',
        ];
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(LeadNote::class, 'lead_id')->latest();
    }

    public function activities(): HasMany
    {
        return $this->hasMany(LeadActivity::class, 'lead_id')->latest();
    }
}
