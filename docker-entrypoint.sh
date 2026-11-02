#!/bin/sh
set -e

echo "=== Initializing RealtyPulse Production Container ==="

# Ensure storage directories exist with open write permissions
mkdir -p /var/www/html/storage/framework/cache/data \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/logs \
         /var/www/html/bootstrap/cache

chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Ensure APP_KEY exists
if [ -z "$APP_KEY" ]; then
    echo "APP_KEY was not provided. Setting default application key..."
    export APP_KEY="base64:g2L5yGeeoTP1lo+/o9o7uF/Eb5zlyXzJavIEEaWkaEg="
fi

# Clear any stale cached configuration
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true
php artisan cache:clear || true

# Attempt auto-migration and initial seed if database is accessible
echo "Checking and executing database migrations..."
php artisan migrate --force || echo "Notice: Database migration pending or Hostinger host connecting..."

# Warm configuration and route caches for lightning-fast production performance
echo "Warming Laravel route, config, and view caches..."
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# Start background services via supervisord
echo "Starting Nginx and PHP-FPM via Supervisord..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
