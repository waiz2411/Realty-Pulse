<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'ip_address',
        'user_agent',
        'device',
        'login_at',
    ];

    protected function casts(): array
    {
        return [
            'login_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Parse User-Agent string to human-friendly device & browser label
     */
    public static function parseDevice(?string $userAgent): string
    {
        if (empty($userAgent)) {
            return 'Unknown Device';
        }

        // Detect OS
        $os = 'Unknown OS';
        if (stripos($userAgent, 'Windows NT 10.0') !== false || stripos($userAgent, 'Windows') !== false) {
            $os = 'Windows';
        } elseif (stripos($userAgent, 'iPhone') !== false) {
            $os = 'iPhone';
        } elseif (stripos($userAgent, 'iPad') !== false) {
            $os = 'iPad';
        } elseif (stripos($userAgent, 'Android') !== false) {
            $os = 'Android';
        } elseif (stripos($userAgent, 'Macintosh') !== false || stripos($userAgent, 'Mac OS X') !== false) {
            $os = 'macOS';
        } elseif (stripos($userAgent, 'Linux') !== false) {
            $os = 'Linux';
        }

        // Detect Browser
        $browser = 'Browser';
        if (stripos($userAgent, 'Edg/') !== false || stripos($userAgent, 'Edge/') !== false) {
            $browser = 'Edge';
        } elseif (stripos($userAgent, 'Chrome/') !== false && stripos($userAgent, 'Chromium') === false) {
            $browser = 'Chrome';
        } elseif (stripos($userAgent, 'Safari/') !== false && stripos($userAgent, 'Chrome') === false) {
            $browser = 'Safari';
        } elseif (stripos($userAgent, 'Firefox/') !== false) {
            $browser = 'Firefox';
        } elseif (stripos($userAgent, 'Opera/') !== false || stripos($userAgent, 'OPR/') !== false) {
            $browser = 'Opera';
        }

        return "{$browser} on {$os}";
    }
}
