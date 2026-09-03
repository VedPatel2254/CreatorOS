# Supabase Production Setup

## 1. Authentication Settings
- Go to: Authentication → Settings
- Site URL: https://your-app.vercel.app
- Redirect URLs: https://your-app.vercel.app/auth/callback
- Enable email confirmations: YES (for production)
- Enable email provider: YES

## 2. Row Level Security
Verify RLS is enabled on ALL tables:
- user_settings
- work_types
- clients
- client_pricing_rules
- tasks
- activity_log
- pdf_import_batches
- payment_records
- invoices
- invoice_line_items
- push_subscriptions
- notification_log

## 3. Storage Buckets
- logos bucket: PUBLIC (for displaying logos in app)
- imports bucket: PRIVATE (PDF files)

## 4. Extensions Required
Enable in: Database → Extensions
- uuid-ossp
- pg_cron
- pg_net

## 5. Edge Functions
Deploy: supabase functions deploy send-notifications --no-verify-jwt

Secrets required:
- APP_URL
- NOTIFICATION_EDGE_SECRET
- SUPABASE_SERVICE_ROLE_KEY (auto-available)

## 6. pg_cron Job
Run the SQL from Phase 8 to create the hourly notification job.

## 7. Database Backups
Free tier: daily backups, 7-day retention
Pro tier: point-in-time recovery

## 8. Verify All DB Functions
- handle_updated_at()
- handle_new_user()
- handle_task_delivered()
- get_next_invoice_number()
