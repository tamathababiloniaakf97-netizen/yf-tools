# Portfolio daily snapshot deployment

This function is designed for Supabase Edge Functions and runs independently of the website.

1. Apply `supabase/migrations/036_portfolio_daily_history.sql` to the linked project.
2. Set a random secret: `supabase secrets set CRON_SECRET=<random-value>`.
3. Deploy: `supabase functions deploy portfolio-daily-snapshot --no-verify-jwt`.
4. In Supabase Dashboard → Integrations → Cron, create an HTTP job:
   - Schedule: `30 0 * * *` (00:30 UTC, 08:30 Asia/Shanghai)
   - Method: `POST`
   - URL: `https://<project-ref>.supabase.co/functions/v1/portfolio-daily-snapshot`
   - Header: `x-cron-secret: <same-random-value>`

The built-in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` function secrets are used for database access. Never commit `CRON_SECRET`.

The job is idempotent: rerunning the same date upserts the account snapshot and replaces that date's position details.
