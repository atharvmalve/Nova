-- One paginated aggregate query avoids per-customer order lookups in the admin list.
create or replace function public.admin_customer_summaries(search_term text default '', page_offset integer default 0, page_limit integer default 20)
returns table (id uuid, name text, email text, phone text, order_count bigint, total_spent_paise bigint, last_order_at timestamptz, total_count bigint)
language sql stable security invoker set search_path = public
as $$
  with filtered as (
    select c.id, c.name, c.email, c.phone
    from customers c
    where public.is_admin() and (coalesce(search_term, '') = '' or c.name ilike '%' || search_term || '%' or c.email ilike '%' || search_term || '%' or coalesce(c.phone, '') ilike '%' || search_term || '%')
  ), aggregated as (
    select f.id, f.name, f.email, f.phone, count(o.id) as order_count,
      coalesce(sum(o.total_paise) filter (where o.payment_status = 'captured'), 0) as total_spent_paise,
      max(o.created_at) as last_order_at
    from filtered f left join orders o on o.customer_id = f.id
    group by f.id, f.name, f.email, f.phone
  )
  select a.*, count(*) over () from aggregated a order by a.last_order_at desc nulls last, a.name asc offset greatest(page_offset, 0) limit least(greatest(page_limit, 1), 100);
$$;
revoke all on function public.admin_customer_summaries(text, integer, integer) from public, anon;
grant execute on function public.admin_customer_summaries(text, integer, integer) to authenticated;
