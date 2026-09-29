-- 为指定联系人开启重要传统节日联系提示。

alter table public.contacts
  add column if not exists holiday_contact_reminder_enabled boolean not null default false;
