-- 扩展私人关系档案：同学、公历/农历生日与分类往来历史。

alter table public.contacts
  drop constraint if exists contacts_relationship_type_check;

alter table public.contacts
  add constraint contacts_relationship_type_check
    check (relationship_type in ('family', 'friend', 'classmate', 'work', 'professional', 'other')),
  add column if not exists birthday_calendar text,
  add column if not exists birthday_year integer,
  add column if not exists birthday_month integer,
  add column if not exists birthday_day integer,
  add column if not exists birthday_is_leap_month boolean not null default false,
  add column if not exists birthday_reminder_enabled boolean not null default true;

alter table public.contacts
  drop constraint if exists contacts_birthday_calendar_check,
  drop constraint if exists contacts_birthday_year_check,
  drop constraint if exists contacts_birthday_month_check,
  drop constraint if exists contacts_birthday_day_check,
  drop constraint if exists contacts_birthday_complete_check,
  drop constraint if exists contacts_birthday_leap_month_check;

alter table public.contacts
  add constraint contacts_birthday_calendar_check
    check (birthday_calendar is null or birthday_calendar in ('solar', 'lunar')),
  add constraint contacts_birthday_year_check
    check (birthday_year is null or birthday_year between 1900 and 2100),
  add constraint contacts_birthday_month_check
    check (birthday_month is null or birthday_month between 1 and 12),
  add constraint contacts_birthday_day_check
    check (birthday_day is null or birthday_day between 1 and 31),
  add constraint contacts_birthday_complete_check
    check (
      (birthday_calendar is null and birthday_month is null and birthday_day is null and birthday_year is null and birthday_is_leap_month = false)
      or
      (birthday_calendar is not null and birthday_month is not null and birthday_day is not null)
    ),
  add constraint contacts_birthday_leap_month_check
    check (birthday_is_leap_month = false or birthday_calendar = 'lunar');

alter table public.contact_interactions
  add column if not exists interaction_type text not null default 'contact';

alter table public.contact_interactions
  drop constraint if exists contact_interactions_interaction_type_check;

alter table public.contact_interactions
  add constraint contact_interactions_interaction_type_check
    check (interaction_type in (
      'contact', 'gift_given', 'gift_received', 'advice_received',
      'advice_given', 'help_received', 'help_given', 'other'
    ));
