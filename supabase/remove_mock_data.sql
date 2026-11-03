-- REMOVES ALL SAMPLE DATA from the database, so only real accounts and real activity remain.
-- Run once in Supabase > SQL Editor. Safe to run again.
--
-- It deletes the sample accounts used while the app was being built:
--   * the five dummy employees (*.test@outlook.com)
--   * the 84 demo accounts behind the admin console's sample mood charts (demo.*@outlook.com)
-- Deleting an account also deletes everything it created (posts, comments, votes, check-ins, chats, photos' records).
-- It does NOT touch the admin and viewer logins, the communities, resources or any other content you maintain.

select count(*) as sample_accounts_before
  from auth.users where email ~* '^demo\..+@outlook\.com$' or email ~* '\.test@outlook\.com$';

delete from auth.users where email ~* '^demo\..+@outlook\.com$' or email ~* '\.test@outlook\.com$';

select count(*) as sample_accounts_after
  from auth.users where email ~* '^demo\..+@outlook\.com$' or email ~* '\.test@outlook\.com$';
