-- CreatorOS Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- user_settings
-- ============================================
create table if not exists user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  business_name text not null default '',
  business_email text not null default '',
  business_phone text not null default '',
  business_address text not null default '',
  logo_url text,
  currency_symbol text not null default '$',
  currency_code text not null default 'USD',
  timezone text not null default 'UTC',
  invoice_prefix text not null default 'INV',
  invoice_next_number integer not null default 1,
  notifications_enabled boolean not null default true,
  notify_24h_before boolean not null default true,
  notify_overdue boolean not null default true,
  notification_sound boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_settings enable row level security;

create policy "Users can view own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on user_settings for update
  using (auth.uid() = user_id);

-- ============================================
-- work_types
-- ============================================
create table if not exists work_types (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table work_types enable row level security;

create policy "Users can manage own work_types"
  on work_types for all
  using (auth.uid() = user_id);

-- ============================================
-- clients
-- ============================================
create table if not exists clients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  business_name text not null,
  contact_name text not null default '',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  notes text not null default '',
  billing_type text not null default 'per_item' check (billing_type in ('per_item', 'monthly_package', 'one_off')),
  monthly_package_amount numeric(12,2),
  payment_preference text not null default '',
  payment_notes text not null default '',
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table clients enable row level security;

create policy "Users can manage own clients"
  on clients for all
  using (auth.uid() = user_id);

-- ============================================
-- client_pricing_rules
-- ============================================
create table if not exists client_pricing_rules (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  work_type_id uuid references work_types(id) on delete cascade not null,
  unit_price numeric(12,2) not null default 0,
  effective_from date not null default current_date,
  effective_to date,
  created_at timestamptz not null default now()
);

alter table client_pricing_rules enable row level security;

create policy "Users can manage own pricing rules"
  on client_pricing_rules for all
  using (auth.uid() = user_id);

-- ============================================
-- tasks
-- ============================================
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references clients(id) on delete cascade not null,
  work_type_id uuid references work_types(id) on delete cascade not null,
  assigned_to text,
  title text not null,
  description text not null default '',
  platform text not null default '',
  deadline timestamptz not null,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'ready', 'delivered', 'cancelled')),
  is_billable boolean not null default true,
  effective_unit_price numeric(12,2),
  billing_quantity integer not null default 1,
  billing_notes text not null default '',
  billing_locked boolean not null default false,
  source text not null default 'manual' check (source in ('manual', 'pdf_import')),
  import_batch_id uuid,
  notes text not null default '',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tasks enable row level security;

create policy "Users can manage own tasks"
  on tasks for all
  using (auth.uid() = user_id);

-- ============================================
-- activity_log
-- ============================================
create table if not exists activity_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  entity_type text not null check (entity_type in ('task', 'invoice', 'client', 'payment')),
  entity_id uuid not null,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

alter table activity_log enable row level security;

create policy "Users can manage own activity_log"
  on activity_log for all
  using (auth.uid() = user_id);

-- ============================================
-- pdf_import_batches
-- ============================================
create table if not exists pdf_import_batches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references clients(id) on delete cascade not null,
  original_filename text not null,
  storage_path text,
  extracted_raw jsonb,
  extraction_method text not null default 'text',
  extraction_confidence text not null default 'low' check (extraction_confidence in ('high', 'medium', 'low', 'failed')),
  status text not null default 'pending_review' check (status in ('pending_review', 'confirmed', 'discarded')),
  task_count_extracted integer not null default 0,
  task_count_created integer not null default 0,
  extraction_warnings jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table pdf_import_batches enable row level security;

create policy "Users can manage own import_batches"
  on pdf_import_batches for all
  using (auth.uid() = user_id);

-- ============================================
-- payment_records
-- ============================================
create table if not exists payment_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references clients(id) on delete cascade not null,
  invoice_id uuid,
  amount numeric(12,2) not null,
  payment_date date not null default current_date,
  payment_method text not null default 'bank_transfer',
  reference text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table payment_records enable row level security;

create policy "Users can manage own payment_records"
  on payment_records for all
  using (auth.uid() = user_id);

-- ============================================
-- invoices
-- ============================================
create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references clients(id) on delete cascade not null,
  invoice_number text not null,
  invoice_type text not null default 'detailed' check (invoice_type in ('detailed', 'summary', 'package')),
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled')),
  issue_date date not null default current_date,
  due_date date,
  billing_period_start date,
  billing_period_end date,
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_label text not null default '',
  tax_rate numeric(5,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  notes text not null default '',
  payment_notes text not null default '',
  pdf_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table invoices enable row level security;

create policy "Users can manage own invoices"
  on invoices for all
  using (auth.uid() = user_id);

-- ============================================
-- invoice_line_items
-- ============================================
create table if not exists invoice_line_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references invoices(id) on delete cascade not null,
  task_id uuid,
  description text not null,
  work_type_name text not null default '',
  delivery_date date,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0,
  amount numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table invoice_line_items enable row level security;

create policy "Users can manage own line_items"
  on invoice_line_items for all
  using (
    exists (
      select 1 from invoices
      where invoices.id = invoice_line_items.invoice_id
      and invoices.user_id = auth.uid()
    )
  );

-- ============================================
-- push_subscriptions
-- ============================================
create table if not exists push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  device_label text not null default '',
  user_agent text not null default '',
  is_active boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "Users can manage own push_subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id);

-- ============================================
-- notification_log
-- ============================================
create table if not exists notification_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid,
  notification_type text not null default 'test' check (notification_type in ('24h_reminder', 'overdue_alert', 'test')),
  title text not null,
  body text not null,
  scheduled_for timestamptz,
  sent_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  error_message text,
  subscription_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table notification_log enable row level security;

create policy "Users can manage own notification_log"
  on notification_log for all
  using (auth.uid() = user_id);

-- ============================================
-- Auto-create user_settings on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (user_id, business_name, business_email)
  values (new.id, '', new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- Auto-update updated_at
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_user_settings_updated_at before update on user_settings
  for each row execute function public.update_updated_at();

create trigger update_clients_updated_at before update on clients
  for each row execute function public.update_updated_at();

create trigger update_tasks_updated_at before update on tasks
  for each row execute function public.update_updated_at();

create trigger update_pdf_import_batches_updated_at before update on pdf_import_batches
  for each row execute function public.update_updated_at();

create trigger update_payment_records_updated_at before update on payment_records
  for each row execute function public.update_updated_at();

create trigger update_invoices_updated_at before update on invoices
  for each row execute function public.update_updated_at();

create trigger update_push_subscriptions_updated_at before update on push_subscriptions
  for each row execute function public.update_updated_at();
