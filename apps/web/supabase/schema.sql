create table public.users (
  id uuid primary key default gen_random_uuid(),
  sui_address varchar(128) unique not null,
  public_key varchar(128) unique,
  delegate_private_key varchar(128),
  account_id varchar(128),
  created_at timestamptz default now()
);

-- Optional: Enable Row Level Security so users can only read their own data
alter table public.users enable row level security;

create policy "Users can read own data" 
  on public.users for select 
  using (auth.uid() = id);