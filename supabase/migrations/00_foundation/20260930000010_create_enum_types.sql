-- Module: foundation
-- Roles inside a workspace, and the pricing tier a workspace is on
-- (docs/product/pricing.md: Free / Pro / Legendary, no Enterprise).
create type public.member_role as enum ('Owner', 'Admin', 'Member', 'Viewer');
create type public.plan_tier as enum ('free', 'pro', 'legendary');
