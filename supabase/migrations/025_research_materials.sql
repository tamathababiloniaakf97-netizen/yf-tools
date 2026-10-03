create table if not exists public.research_materials (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_type text not null check (material_type in ('fact', 'news', 'viewpoint', 'report_excerpt')),
  title text not null,
  content text not null,
  asset_name text,
  source_name text,
  source_url text,
  source_date date,
  personal_note text,
  image_paths jsonb not null default '[]'::jsonb check (jsonb_typeof(image_paths) = 'array' and jsonb_array_length(image_paths) <= 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.evidence_records
  add column if not exists material_id uuid references public.research_materials(id) on delete set null;

create index if not exists idx_materials_user_created on public.research_materials(user_id, created_at desc);
create index if not exists idx_materials_user_type on public.research_materials(user_id, material_type);
create index if not exists idx_materials_user_asset on public.research_materials(user_id, asset_name);
create index if not exists idx_evidence_material on public.evidence_records(material_id);

alter table public.research_materials enable row level security;

drop policy if exists "users_select_own_research_materials" on public.research_materials;
create policy "users_select_own_research_materials" on public.research_materials for select using (auth.uid() = user_id);
drop policy if exists "users_insert_own_research_materials" on public.research_materials;
create policy "users_insert_own_research_materials" on public.research_materials for insert with check (auth.uid() = user_id);
drop policy if exists "users_update_own_research_materials" on public.research_materials;
create policy "users_update_own_research_materials" on public.research_materials for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users_delete_own_research_materials" on public.research_materials;
create policy "users_delete_own_research_materials" on public.research_materials for delete using (auth.uid() = user_id);

grant select, insert, update, delete on table public.research_materials to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('research-material-images', 'research-material-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "users_read_own_research_material_images" on storage.objects;
create policy "users_read_own_research_material_images" on storage.objects for select to authenticated
using (bucket_id = 'research-material-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "users_insert_own_research_material_images" on storage.objects;
create policy "users_insert_own_research_material_images" on storage.objects for insert to authenticated
with check (bucket_id = 'research-material-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "users_delete_own_research_material_images" on storage.objects;
create policy "users_delete_own_research_material_images" on storage.objects for delete to authenticated
using (bucket_id = 'research-material-images' and (storage.foldername(name))[1] = auth.uid()::text);
