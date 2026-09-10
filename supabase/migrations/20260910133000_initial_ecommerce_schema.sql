-- NOVA agency ecommerce: initial schema and browser-facing authorization.
-- This migration is intentionally not idempotent; Supabase migrations are applied once.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('customer', 'admin', 'owner');
create type public.product_status as enum ('draft', 'active', 'archived');
create type public.order_status as enum ('created', 'payment_pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'expired');
create type public.payment_status as enum ('pending', 'created', 'authorized', 'captured', 'failed', 'refunded', 'cancelled');
create type public.fulfillment_status as enum ('unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled');
create type public.payment_provider as enum ('razorpay');
create type public.webhook_processing_status as enum ('pending', 'processed', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_path text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_not_empty check (length(trim(name)) > 0),
  constraint categories_slug_not_empty check (length(trim(slug)) > 0),
  constraint categories_sort_order_non_negative check (sort_order >= 0)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  status public.product_status not null default 'draft',
  price_paise bigint not null,
  compare_at_price_paise bigint,
  sku text unique,
  inventory_quantity integer not null default 0,
  track_inventory boolean not null default true,
  category_id uuid references public.categories(id) on delete set null,
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_title_not_empty check (length(trim(title)) > 0),
  constraint products_slug_not_empty check (length(trim(slug)) > 0),
  constraint products_price_non_negative check (price_paise >= 0),
  constraint products_compare_price_non_negative check (compare_at_price_paise is null or compare_at_price_paise >= 0),
  constraint products_inventory_non_negative check (inventory_quantity >= 0),
  constraint products_compare_price_valid check (compare_at_price_paise is null or compare_at_price_paise >= price_paise)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint product_images_sort_order_non_negative check (sort_order >= 0),
  constraint product_images_storage_path_not_empty check (length(trim(storage_path)) > 0),
  constraint product_images_product_path_unique unique (product_id, storage_path)
);

-- A customer may exist without an auth account to support guest checkout.
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_name_not_empty check (length(trim(name)) > 0),
  constraint customers_email_not_empty check (length(trim(email)) > 0)
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  recipient_name text not null,
  phone text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'India',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint addresses_recipient_not_empty check (length(trim(recipient_name)) > 0),
  constraint addresses_phone_not_empty check (length(trim(phone)) > 0),
  constraint addresses_address_not_empty check (length(trim(address_line_1)) > 0),
  constraint addresses_city_not_empty check (length(trim(city)) > 0),
  constraint addresses_state_not_empty check (length(trim(state)) > 0),
  constraint addresses_postal_code_not_empty check (length(trim(postal_code)) > 0),
  constraint addresses_country_not_empty check (length(trim(country)) > 0)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address jsonb not null,
  status public.order_status not null default 'created',
  payment_status public.payment_status not null default 'pending',
  fulfillment_status public.fulfillment_status not null default 'unfulfilled',
  subtotal_paise bigint not null,
  shipping_paise bigint not null default 0,
  discount_paise bigint not null default 0,
  tax_paise bigint not null default 0,
  total_paise bigint not null,
  currency text not null default 'INR',
  razorpay_order_id text unique,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_number_not_empty check (length(trim(order_number)) > 0),
  constraint orders_customer_name_not_empty check (length(trim(customer_name)) > 0),
  constraint orders_customer_email_not_empty check (length(trim(customer_email)) > 0),
  constraint orders_shipping_address_object check (jsonb_typeof(shipping_address) = 'object'),
  constraint orders_subtotal_non_negative check (subtotal_paise >= 0),
  constraint orders_shipping_non_negative check (shipping_paise >= 0),
  constraint orders_discount_non_negative check (discount_paise >= 0),
  constraint orders_tax_non_negative check (tax_paise >= 0),
  constraint orders_total_non_negative check (total_paise >= 0),
  constraint orders_total_calculation check (total_paise = subtotal_paise + shipping_paise + tax_paise - discount_paise),
  constraint orders_currency_valid check (currency = 'INR')
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_title text not null,
  sku text,
  unit_price_paise bigint not null,
  quantity integer not null,
  total_paise bigint not null,
  created_at timestamptz not null default now(),
  constraint order_items_product_title_not_empty check (length(trim(product_title)) > 0),
  constraint order_items_price_non_negative check (unit_price_paise >= 0),
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_total_non_negative check (total_paise >= 0),
  constraint order_items_total_calculation check (total_paise = unit_price_paise * quantity)
);

-- Payment and webhook records are server-only but are created now to preserve
-- the supplied checkout data model and its foreign-key relationships.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider public.payment_provider not null default 'razorpay',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  amount_paise bigint not null,
  currency text not null default 'INR',
  status public.payment_status not null default 'pending',
  signature_verified boolean not null default false,
  provider_metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_amount_positive check (amount_paise > 0),
  constraint payments_currency_valid check (currency = 'INR'),
  constraint payments_razorpay_payment_unique unique (razorpay_payment_id)
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider public.payment_provider not null,
  provider_event_id text not null,
  event_type text,
  payload jsonb not null,
  processing_status public.webhook_processing_status not null default 'pending',
  processing_error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint webhook_provider_event_unique unique (provider, provider_event_id)
);

create index idx_categories_active_sort_order on public.categories (sort_order, name) where is_active;
create index idx_products_status on public.products (status);
create index idx_products_category on public.products (category_id);
create index idx_products_created_at on public.products (created_at desc);
create index idx_products_active_category on public.products (category_id, created_at desc) where status = 'active';
create index idx_product_images_product_sort on public.product_images (product_id, sort_order);
create index idx_customers_email on public.customers (lower(email));
create index idx_addresses_customer on public.addresses (customer_id);
create unique index idx_addresses_one_default_per_customer on public.addresses (customer_id) where is_default;
create index idx_orders_customer_created_at on public.orders (customer_id, created_at desc);
create index idx_orders_status_created_at on public.orders (status, created_at desc);
create index idx_orders_payment_status on public.orders (payment_status);
create index idx_orders_razorpay_order on public.orders (razorpay_order_id) where razorpay_order_id is not null;
create index idx_order_items_order on public.order_items (order_id);
create index idx_order_items_product on public.order_items (product_id) where product_id is not null;
create index idx_payments_order on public.payments (order_id);
create index idx_payments_razorpay_order on public.payments (razorpay_order_id) where razorpay_order_id is not null;
create index idx_webhook_events_created_at on public.webhook_events (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), new.email, 'customer');
  return new;
end;
$$;

-- SECURITY DEFINER prevents recursive RLS evaluation in authorization policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'owner')
  );
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public, auth
as $$
  select role from public.profiles where id = auth.uid();
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger addresses_updated_at before update on public.addresses for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger payments_updated_at before update on public.payments for each row execute function public.set_updated_at();
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.customers enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.webhook_events enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own_without_role_change" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and role = public.current_user_role());
create policy "profiles_admin_manage" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "categories_select_active_or_admin" on public.categories for select to anon, authenticated using (is_active or public.is_admin());
create policy "categories_admin_manage" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "products_select_active_or_admin" on public.products for select to anon, authenticated using (status = 'active' or public.is_admin());
create policy "products_admin_manage" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "product_images_select_active_product_or_admin" on public.product_images for select to anon, authenticated using (public.is_admin() or exists (select 1 from public.products where products.id = product_images.product_id and products.status = 'active'));
create policy "product_images_admin_manage" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "customers_select_own_or_admin" on public.customers for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "customers_admin_manage" on public.customers for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "addresses_select_own_or_admin" on public.addresses for select to authenticated using (public.is_admin() or exists (select 1 from public.customers where customers.id = addresses.customer_id and customers.user_id = auth.uid()));
create policy "addresses_insert_own" on public.addresses for insert to authenticated with check (exists (select 1 from public.customers where customers.id = addresses.customer_id and customers.user_id = auth.uid()));
create policy "addresses_update_own_or_admin" on public.addresses for update to authenticated using (public.is_admin() or exists (select 1 from public.customers where customers.id = addresses.customer_id and customers.user_id = auth.uid())) with check (public.is_admin() or exists (select 1 from public.customers where customers.id = addresses.customer_id and customers.user_id = auth.uid()));
create policy "addresses_delete_own_or_admin" on public.addresses for delete to authenticated using (public.is_admin() or exists (select 1 from public.customers where customers.id = addresses.customer_id and customers.user_id = auth.uid()));

create policy "orders_select_own_or_admin" on public.orders for select to authenticated using (public.is_admin() or exists (select 1 from public.customers where customers.id = orders.customer_id and customers.user_id = auth.uid()));
create policy "orders_admin_manage" on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "order_items_select_own_or_admin" on public.order_items for select to authenticated using (public.is_admin() or exists (select 1 from public.orders join public.customers on customers.id = orders.customer_id where orders.id = order_items.order_id and customers.user_id = auth.uid()));
create policy "order_items_admin_manage" on public.order_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Payments contain provider references and signatures, so browser roles have no access.
-- The checkout and webhook services use a server-only service-role client.
create policy "payments_admin_read" on public.payments for select to authenticated using (public.is_admin());
-- webhook_events intentionally has no browser policy.

revoke all on public.webhook_events from anon, authenticated;
revoke insert, update, delete on public.payments from anon, authenticated;
revoke insert, update, delete on public.orders from anon, authenticated;
revoke insert, update, delete on public.order_items from anon, authenticated;
