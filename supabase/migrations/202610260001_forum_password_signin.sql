-- Apply after 202610220001_student_forum.sql. Accounts remain required;
-- SMU email ownership is no longer verified. Existing posts are preserved.
begin;
create or replace function cgc_forum.member() returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid := auth.uid(); e text;
begin
  if u is null then raise exception 'Sign in to join the conversation.'; end if;
  select email into e from auth.users where id=u;
  if e is null or e !~* '^[^@]+@smu\.edu$' then raise exception 'Only SMU email addresses are accepted.'; end if;
  insert into cgc_forum.members(id) values(u) on conflict(id) do nothing;
  if exists(select 1 from cgc_forum.members where id=u and banned) then raise exception 'Your forum access is suspended. Contact the council.'; end if;
  return u;
end $$;
revoke all on function cgc_forum.member() from public,anon,authenticated,service_role;
commit;
