# Portfolio daily snapshot deployment

This function is designed for Supabase Edge Functions and runs independently of the website.

1. Apply `supabase/migrations/036_portfolio_daily_history.sql` to the linked project.
2. Create a random value, save the same value as Edge Function secret `CRON_SECRET` and as the Supabase Vault secret named `portfolio_snapshot_cron_secret`.
3. Deploy: `supabase functions deploy portfolio-daily-snapshot --no-verify-jwt`.
4. Apply `supabase/migrations/037_portfolio_snapshot_service_role.sql` and `038_portfolio_snapshot_cron.sql`. Migration 038 creates the daily `30 0 * * *` UTC job (08:30 Asia/Shanghai) and reads the request header from Vault.

The built-in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` function secrets are used for database access. Never commit the value of `CRON_SECRET` or the Vault secret.

The job is idempotent: rerunning the same date upserts the account snapshot and replaces that date's position details.
