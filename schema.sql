-- MenuMe — schema do banco de dados
-- Cole este script inteiro no SQL Editor do seu projeto Supabase e clique em "Run".

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tabela de lugares (restaurantes, padarias, cafeterias, etc.)
-- ---------------------------------------------------------------------
create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  name_lower text not null,
  category text not null default 'outro',
  lat double precision,
  lng double precision,
  overall_rating text,
  overall_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists places_user_id_idx on places(user_id);

-- ---------------------------------------------------------------------
-- Tabela de pratos (itens avaliados dentro de um lugar)
-- ---------------------------------------------------------------------
create table if not exists dishes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id uuid not null references places(id) on delete cascade,
  dish text not null,
  rating text not null,
  note text,
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dishes_user_id_idx on dishes(user_id);
create index if not exists dishes_place_id_idx on dishes(place_id);

-- ---------------------------------------------------------------------
-- Segurança: cada pessoa só enxerga e edita os PRÓPRIOS registros.
-- (No futuro, para permitir que todo mundo veja as avaliações de
-- todos — tipo review do Google — basta trocar a política de SELECT
-- abaixo para "using (true)" em vez de "using (auth.uid() = user_id)".)
-- ---------------------------------------------------------------------
alter table places enable row level security;
alter table dishes enable row level security;

create policy "places: cada usuário vê os próprios" on places
  for select using (auth.uid() = user_id);
create policy "places: cada usuário insere os próprios" on places
  for insert with check (auth.uid() = user_id);
create policy "places: cada usuário edita os próprios" on places
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "places: cada usuário apaga os próprios" on places
  for delete using (auth.uid() = user_id);

create policy "dishes: cada usuário vê os próprios" on dishes
  for select using (auth.uid() = user_id);
create policy "dishes: cada usuário insere os próprios" on dishes
  for insert with check (auth.uid() = user_id);
create policy "dishes: cada usuário edita os próprios" on dishes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dishes: cada usuário apaga os próprios" on dishes
  for delete using (auth.uid() = user_id);
