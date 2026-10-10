create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if not exists (select 1 from vault.decrypted_secrets where name = 'portfolio_snapshot_cron_secret') then
    raise exception 'Create Vault secret portfolio_snapshot_cron_secret before applying this migration';
  end if;
end;
$$;

select cron.unschedule(jobid)
from cron.job
where jobname = 'portfolio-daily-snapshot';

select cron.schedule(
  'portfolio-daily-snapshot',
  '30 0 * * *',
  $job$
    select net.http_post(
      url := 'https://ruherrozielggtcoqqdr.supabase.co/functions/v1/portfolio-daily-snapshot',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'portfolio_snapshot_cron_secret'
          limit 1
        )
      ),
      body := '{}'::jsonb
    );
  $job$
);
