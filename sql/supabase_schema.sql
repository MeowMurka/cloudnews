-- Профили (связываем с auth.users)
create table if not exists public.profiles (
id uuid primary key references auth.users(id) on delete cascade,
role text not null default 'user',
created_at timestamptz not null default now()
);


-- Баланс
create table if not exists public.balances (
user_id uuid primary key references public.profiles(id) on delete cascade,
amount integer not null default 0
);


-- Слоты «газеты»
create table if not exists public.slots (
id serial primary key,
code text unique not null,
width int not null,
height int not null,
price int not null
);


-- Размещения
create table if not exists public.placements (
id serial primary key,
slot_id int not null references public.slots(id) on delete cascade,
user_id uuid not null references public.profiles(id) on delete cascade,
title text not null,
body text not null,
image_url text,
starts_at timestamptz not null default now(),
expires_at timestamptz not null,
is_active boolean not null default true,
created_at timestamptz not null default now()
);


-- RLS
alter table public.profiles enable row level security;
alter table public.balances enable row level security;
alter table public.slots enable row level security;
alter table public.placements enable row level security;


-- Политики: чтение всем, запись ограниченно (сервером через service-role)
create policy "read_profiles" on public.profiles for select using (true);
create policy "read_slots" on public.slots for select using (true);
create policy "read_active_placements" on public.placements for select using (true);
create policy "read_own_balance" on public.balances for select using (auth.uid() = user_id);


-- (Вставка/обновление профилей/баланса/размещений выполняется сервером через service key)