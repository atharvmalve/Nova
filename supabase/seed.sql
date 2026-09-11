-- NOVA demo catalog and order data. Safe to rerun: cleanup is limited to the
-- NOVA-DEMO order namespace, demo-only slugs, and the reserved example emails.
begin;

delete from public.orders where order_number like 'NOVA-DEMO-%';
delete from public.customers where email in ('aarav.mehta@nova-demo.example', 'riya.shah@nova-demo.example', 'kabir.kapoor@nova-demo.example', 'ananya.rao@nova-demo.example', 'vihaan.desai@nova-demo.example');

insert into public.categories (name, slug, description, is_active, sort_order) values
  ('Apparel', 'apparel', 'Elevated everyday apparel for modern wardrobes.', true, 1),
  ('Accessories', 'accessories', 'Considered finishing pieces for daily life.', true, 2),
  ('Footwear', 'footwear', 'Versatile footwear designed for the city.', true, 3)
on conflict (slug) do update set name = excluded.name, description = excluded.description, is_active = excluded.is_active, sort_order = excluded.sort_order;

insert into public.products (title, slug, description, status, price_paise, sku, inventory_quantity, track_inventory, category_id, meta_title) values
  ('Essential Oversized Tee', 'essential-oversized-tee', 'A heavyweight cotton tee with a relaxed drape, clean neckline, and an easy everyday fit.', 'active', 129900, 'NOVA-TEE-001', 42, true, (select id from categories where slug = 'apparel'), 'Essential Oversized Tee | NOVA'),
  ('Premium Cotton Shirt', 'premium-cotton-shirt', 'A crisp, breathable cotton shirt cut with a refined collar and a comfortable modern silhouette.', 'active', 249900, 'NOVA-SHIRT-001', 24, true, (select id from categories where slug = 'apparel'), 'Premium Cotton Shirt | NOVA'),
  ('Everyday Relaxed Hoodie', 'everyday-relaxed-hoodie', 'Soft brushed fleece, a structured hood, and a relaxed fit for cooler city mornings.', 'active', 299900, 'NOVA-HOODIE-001', 18, true, (select id from categories where slug = 'apparel'), 'Everyday Relaxed Hoodie | NOVA'),
  ('Minimal Linen Overshirt', 'minimal-linen-overshirt', 'A lightweight linen overshirt with subtle texture and roomy utility pockets.', 'active', 349900, 'NOVA-LINEN-001', 12, true, (select id from categories where slug = 'apparel'), 'Minimal Linen Overshirt | NOVA'),
  ('Classic Leather Wallet', 'classic-leather-wallet', 'A slim full-grain leather wallet with considered card storage and a soft hand feel.', 'active', 149900, 'NOVA-WALLET-001', 31, true, (select id from categories where slug = 'accessories'), 'Classic Leather Wallet | NOVA'),
  ('Everyday Canvas Backpack', 'everyday-canvas-backpack', 'A durable cotton-canvas backpack with a padded sleeve and practical organization.', 'active', 249900, 'NOVA-BACKPACK-001', 16, true, (select id from categories where slug = 'accessories'), 'Everyday Canvas Backpack | NOVA'),
  ('Minimal Steel Watch', 'minimal-steel-watch', 'A clean brushed-steel watch with a precise quartz movement and understated dial.', 'active', 499900, 'NOVA-WATCH-001', 8, true, (select id from categories where slug = 'accessories'), 'Minimal Steel Watch | NOVA'),
  ('Urban Runner Sneakers', 'urban-runner-sneakers', 'Lightweight everyday runners with cushioned support and a streamlined technical upper.', 'active', 399900, 'NOVA-RUNNER-001', 14, true, (select id from categories where slug = 'footwear'), 'Urban Runner Sneakers | NOVA'),
  ('Classic Court Sneakers', 'classic-court-sneakers', 'Timeless low-top court sneakers in smooth leather with a comfortable rubber cupsole.', 'active', 349900, 'NOVA-COURT-001', 21, true, (select id from categories where slug = 'footwear'), 'Classic Court Sneakers | NOVA'),
  ('Everyday Slip-On', 'everyday-slip-on', 'Easy slip-ons with a flexible sole and breathable knit upper for daily movement.', 'active', 229900, 'NOVA-SLIPON-001', 27, true, (select id from categories where slug = 'footwear'), 'Everyday Slip-On | NOVA')
on conflict (slug) do update set title = excluded.title, description = excluded.description, status = excluded.status, price_paise = excluded.price_paise, sku = excluded.sku, inventory_quantity = excluded.inventory_quantity, track_inventory = excluded.track_inventory, category_id = excluded.category_id, meta_title = excluded.meta_title;

delete from public.product_images using public.products where product_images.product_id = products.id and products.slug in ('essential-oversized-tee','premium-cotton-shirt','everyday-relaxed-hoodie','minimal-linen-overshirt','classic-leather-wallet','everyday-canvas-backpack','minimal-steel-watch','urban-runner-sneakers','classic-court-sneakers','everyday-slip-on');
insert into public.product_images (product_id, storage_path, alt_text, sort_order)
select p.id, v.url, p.title, 0 from public.products p join (values
  ('essential-oversized-tee','https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80'),
  ('premium-cotton-shirt','https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80'),
  ('everyday-relaxed-hoodie','https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80'),
  ('minimal-linen-overshirt','https://images.unsplash.com/photo-1506629905607-d405b7a30db5?auto=format&fit=crop&w=900&q=80'),
  ('classic-leather-wallet','https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80'),
  ('everyday-canvas-backpack','https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80'),
  ('minimal-steel-watch','https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=80'),
  ('urban-runner-sneakers','https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80'),
  ('classic-court-sneakers','https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80'),
  ('everyday-slip-on','https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=900&q=80')
) as v(slug, url) on p.slug = v.slug;

insert into public.customers (id, name, email, phone) values
  ('10000000-0000-0000-0000-000000000001', 'Aarav Mehta', 'aarav.mehta@nova-demo.example', '9000000001'),
  ('10000000-0000-0000-0000-000000000002', 'Riya Shah', 'riya.shah@nova-demo.example', '9000000002'),
  ('10000000-0000-0000-0000-000000000003', 'Kabir Kapoor', 'kabir.kapoor@nova-demo.example', '9000000003'),
  ('10000000-0000-0000-0000-000000000004', 'Ananya Rao', 'ananya.rao@nova-demo.example', '9000000004'),
  ('10000000-0000-0000-0000-000000000005', 'Vihaan Desai', 'vihaan.desai@nova-demo.example', '9000000005');

with order_specs(order_number, email, status, payment_status, fulfillment_status, created_at) as (values
  ('NOVA-DEMO-001','aarav.mehta@nova-demo.example','delivered'::public.order_status,'captured'::public.payment_status,'delivered'::public.fulfillment_status, now() - interval '2 days'),
  ('NOVA-DEMO-002','riya.shah@nova-demo.example','shipped','captured','shipped', now() - interval '5 days'),
  ('NOVA-DEMO-003','kabir.kapoor@nova-demo.example','processing','captured','processing', now() - interval '9 days'),
  ('NOVA-DEMO-004','ananya.rao@nova-demo.example','paid','captured','confirmed', now() - interval '13 days'),
  ('NOVA-DEMO-005','vihaan.desai@nova-demo.example','payment_pending','created','unfulfilled', now() - interval '17 days'),
  ('NOVA-DEMO-006','aarav.mehta@nova-demo.example','delivered','captured','delivered', now() - interval '21 days'),
  ('NOVA-DEMO-007','riya.shah@nova-demo.example','cancelled','failed','cancelled', now() - interval '26 days'),
  ('NOVA-DEMO-008','kabir.kapoor@nova-demo.example','shipped','captured','shipped', now() - interval '31 days'),
  ('NOVA-DEMO-009','ananya.rao@nova-demo.example','delivered','captured','delivered', now() - interval '37 days'),
  ('NOVA-DEMO-010','vihaan.desai@nova-demo.example','processing','captured','processing', now() - interval '44 days'),
  ('NOVA-DEMO-011','aarav.mehta@nova-demo.example','payment_pending','pending','unfulfilled', now() - interval '52 days'),
  ('NOVA-DEMO-012','riya.shah@nova-demo.example','delivered','captured','delivered', now() - interval '61 days'),
  ('NOVA-DEMO-013','kabir.kapoor@nova-demo.example','cancelled','failed','cancelled', now() - interval '71 days'),
  ('NOVA-DEMO-014','ananya.rao@nova-demo.example','paid','captured','confirmed', now() - interval '82 days'),
  ('NOVA-DEMO-015','vihaan.desai@nova-demo.example','delivered','captured','delivered', now() - interval '94 days')
), lines(order_number, slug, quantity) as (values
  ('NOVA-DEMO-001','essential-oversized-tee',2),('NOVA-DEMO-001','classic-leather-wallet',1),('NOVA-DEMO-002','urban-runner-sneakers',1),('NOVA-DEMO-002','everyday-slip-on',1),('NOVA-DEMO-003','premium-cotton-shirt',1),('NOVA-DEMO-003','minimal-steel-watch',1),('NOVA-DEMO-004','minimal-linen-overshirt',1),('NOVA-DEMO-005','everyday-canvas-backpack',1),('NOVA-DEMO-005','essential-oversized-tee',1),('NOVA-DEMO-006','everyday-relaxed-hoodie',1),('NOVA-DEMO-006','classic-court-sneakers',1),('NOVA-DEMO-007','minimal-steel-watch',1),('NOVA-DEMO-008','urban-runner-sneakers',1),('NOVA-DEMO-008','premium-cotton-shirt',2),('NOVA-DEMO-009','classic-leather-wallet',2),('NOVA-DEMO-009','everyday-slip-on',1),('NOVA-DEMO-010','minimal-linen-overshirt',1),('NOVA-DEMO-010','everyday-canvas-backpack',1),('NOVA-DEMO-011','essential-oversized-tee',3),('NOVA-DEMO-012','everyday-relaxed-hoodie',1),('NOVA-DEMO-012','classic-court-sneakers',1),('NOVA-DEMO-013','premium-cotton-shirt',1),('NOVA-DEMO-014','minimal-steel-watch',1),('NOVA-DEMO-014','classic-leather-wallet',1),('NOVA-DEMO-015','urban-runner-sneakers',1),('NOVA-DEMO-015','everyday-slip-on',2)
), totals as (select l.order_number, sum(p.price_paise * l.quantity) as subtotal from lines l join products p on p.slug = l.slug group by l.order_number)
insert into public.orders (order_number, customer_id, customer_name, customer_email, customer_phone, shipping_address, status, payment_status, fulfillment_status, subtotal_paise, total_paise, created_at, updated_at, notes)
select s.order_number, c.id, c.name, c.email, c.phone, jsonb_build_object('recipientName',c.name,'phone',c.phone,'addressLine1','Demo Residence','city','Mumbai','state','Maharashtra','postalCode','400001','country','India'), s.status, s.payment_status, s.fulfillment_status, t.subtotal, t.subtotal, s.created_at, s.created_at, 'Demo data only; no live Razorpay payment was processed.' from order_specs s join customers c on c.email = s.email join totals t on t.order_number = s.order_number;

with lines(order_number, slug, quantity) as (values
  ('NOVA-DEMO-001','essential-oversized-tee',2),('NOVA-DEMO-001','classic-leather-wallet',1),('NOVA-DEMO-002','urban-runner-sneakers',1),('NOVA-DEMO-002','everyday-slip-on',1),('NOVA-DEMO-003','premium-cotton-shirt',1),('NOVA-DEMO-003','minimal-steel-watch',1),('NOVA-DEMO-004','minimal-linen-overshirt',1),('NOVA-DEMO-005','everyday-canvas-backpack',1),('NOVA-DEMO-005','essential-oversized-tee',1),('NOVA-DEMO-006','everyday-relaxed-hoodie',1),('NOVA-DEMO-006','classic-court-sneakers',1),('NOVA-DEMO-007','minimal-steel-watch',1),('NOVA-DEMO-008','urban-runner-sneakers',1),('NOVA-DEMO-008','premium-cotton-shirt',2),('NOVA-DEMO-009','classic-leather-wallet',2),('NOVA-DEMO-009','everyday-slip-on',1),('NOVA-DEMO-010','minimal-linen-overshirt',1),('NOVA-DEMO-010','everyday-canvas-backpack',1),('NOVA-DEMO-011','essential-oversized-tee',3),('NOVA-DEMO-012','everyday-relaxed-hoodie',1),('NOVA-DEMO-012','classic-court-sneakers',1),('NOVA-DEMO-013','premium-cotton-shirt',1),('NOVA-DEMO-014','minimal-steel-watch',1),('NOVA-DEMO-014','classic-leather-wallet',1),('NOVA-DEMO-015','urban-runner-sneakers',1),('NOVA-DEMO-015','everyday-slip-on',2)
)
insert into public.order_items (order_id, product_id, product_title, sku, unit_price_paise, quantity, total_paise, created_at)
select o.id, p.id, p.title, p.sku, p.price_paise, l.quantity, p.price_paise * l.quantity, o.created_at from lines l join orders o on o.order_number = l.order_number join products p on p.slug = l.slug;

commit;
