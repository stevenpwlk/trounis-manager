-- Trounis Manager — persistance des mondes (P2 §22 : 3 emplacements de sauvegarde par compte).
-- Purement additif : nouvelle table, aucune modification aux tables existantes de l'écosystème.
-- Même projet Supabase que Trounis Prono/Cavity Game — les comptes sont partagés (auth.users),
-- mais cette table est isolée par RLS, un utilisateur ne voit jamais les mondes d'un autre compte.

create table if not exists public.manager_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slot smallint not null check (slot between 1 and 3),
  world_name text not null,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slot)
);

alter table public.manager_saves enable row level security;

create policy "manager_saves_select_own" on public.manager_saves
  for select using (auth.uid() = user_id);

create policy "manager_saves_insert_own" on public.manager_saves
  for insert with check (auth.uid() = user_id);

create policy "manager_saves_update_own" on public.manager_saves
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "manager_saves_delete_own" on public.manager_saves
  for delete using (auth.uid() = user_id);
