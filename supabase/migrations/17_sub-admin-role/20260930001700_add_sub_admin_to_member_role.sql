-- Module: Sub Admin role
-- Adds the "Sub Admin" role (team leads such as QA, HR or sales leads) between
-- Admin and Member. Run this file ON ITS OWN first: Postgres can't use a new enum
-- value in the same transaction that adds it.
alter type public.member_role add value if not exists 'Sub Admin' after 'Admin';
