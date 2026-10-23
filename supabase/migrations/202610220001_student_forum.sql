-- Run once in the Supabase SQL editor. Forum data is private, not a public REST table.
begin;
create schema if not exists cgc_forum;
revoke all on schema cgc_forum from public, anon, authenticated, service_role;
alter default privileges in schema cgc_forum revoke execute on functions from public;

create table cgc_forum.settings (singleton boolean primary key default true check(singleton), anonymous_salt uuid not null default gen_random_uuid());
insert into cgc_forum.settings(singleton) values(true);
create table cgc_forum.members (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Graduate student' check(char_length(display_name) between 2 and 60),
  banned boolean not null default false, created_at timestamptz not null default now()
);
create unique index forum_unique_display_name on cgc_forum.members(lower(display_name)) where display_name <> 'Graduate student';
create table cgc_forum.topics (
  id uuid primary key default gen_random_uuid(), author_id uuid not null references cgc_forum.members(id),
  category text not null check(category in ('general','research','events','opportunities','help','introductions')),
  title text not null check(char_length(trim(title)) between 4 and 160),
  body text not null check(char_length(trim(body)) between 2 and 8000),
  anonymous boolean not null default false, pinned boolean not null default false, locked boolean not null default false,
  hidden boolean not null default false, deleted boolean not null default false,
  created_at timestamptz not null default now(), edited_at timestamptz,
  last_activity timestamptz not null default now(), request_id uuid not null default gen_random_uuid(), unique(author_id,request_id)
);
create index forum_topics_feed on cgc_forum.topics(pinned desc,last_activity desc,id desc) where not hidden and not deleted;
create index forum_topics_category on cgc_forum.topics(category,last_activity desc);
create index forum_topics_search on cgc_forum.topics using gin(to_tsvector('english',title || ' ' || body));
create table cgc_forum.replies (
  id uuid primary key default gen_random_uuid(), topic_id uuid not null references cgc_forum.topics(id) on delete cascade,
  author_id uuid not null references cgc_forum.members(id), body text not null check(char_length(trim(body)) between 2 and 8000),
  anonymous boolean not null default false, hidden boolean not null default false, deleted boolean not null default false,
  created_at timestamptz not null default now(), edited_at timestamptz, request_id uuid not null default gen_random_uuid(), unique(author_id,request_id)
);
create index forum_replies_thread on cgc_forum.replies(topic_id,created_at,id);
create table cgc_forum.reports (
  id uuid primary key default gen_random_uuid(), reporter_id uuid not null references cgc_forum.members(id),
  kind text not null check(kind in ('topic','reply')), target_id uuid not null,
  reason text not null check(char_length(trim(reason)) between 5 and 1000),
  status text not null default 'open' check(status in ('open','resolved')), created_at timestamptz not null default now(),
  unique(reporter_id,kind,target_id)
);
create index forum_reports_queue on cgc_forum.reports(status,created_at);
create table cgc_forum.rate_events (member_id uuid not null references cgc_forum.members(id),kind text not null, created_at timestamptz not null default now());
create index forum_rate_member on cgc_forum.rate_events(member_id,kind,created_at);
create table cgc_forum.audit (
  id bigint generated always as identity primary key, actor text not null, action text not null,
  target_id uuid not null, before_content jsonb, created_at timestamptz not null default now()
);
alter table cgc_forum.settings enable row level security;
alter table cgc_forum.members enable row level security;
alter table cgc_forum.topics enable row level security;
alter table cgc_forum.replies enable row level security;
alter table cgc_forum.reports enable row level security;
alter table cgc_forum.rate_events enable row level security;
alter table cgc_forum.audit enable row level security;
revoke all on all tables in schema cgc_forum from public,anon,authenticated,service_role;

create function cgc_forum.member() returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid := auth.uid(); e text; confirmed timestamptz;
begin
  if u is null then raise exception 'Sign in to join the conversation.'; end if;
  select email,email_confirmed_at into e,confirmed from auth.users where id=u;
  if confirmed is null or e is null or e !~* '^[^@]+@smu\.edu$' then raise exception 'A verified SMU email address is required.'; end if;
  insert into cgc_forum.members(id) values(u) on conflict(id) do nothing;
  if exists(select 1 from cgc_forum.members where id=u and banned) then raise exception 'Your forum access is suspended. Contact the council.'; end if;
  return u;
end $$;
create function cgc_forum.rate_limit(u uuid,k text,n integer,s integer) returns void language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(u::text,0));
  if (select count(*) from cgc_forum.rate_events where member_id=u and kind=k and created_at > now()-make_interval(secs=>s)) >= n then raise exception 'Wait a little before posting again.'; end if;
  insert into cgc_forum.rate_events(member_id,kind) values(u,k);
  delete from cgc_forum.rate_events where member_id=u and created_at < now()-interval '1 day';
end $$;
create function cgc_forum.author_label(u uuid,a boolean,t uuid) returns text language sql stable security definer set search_path='' as $$
  select case when a then 'Anonymous student ' || upper(substr(md5(s.anonymous_salt::text || u::text || t::text),1,6)) else coalesce(m.display_name,'Graduate student') end
  from cgc_forum.settings s left join cgc_forum.members m on m.id=u where s.singleton;
$$;
create function cgc_forum.topic_json(t cgc_forum.topics,v uuid,full_body boolean default false) returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('id',t.id,'title',t.title,'body',case when full_body then t.body else left(t.body,220) end,
    'category',t.category,'author_label',cgc_forum.author_label(t.author_id,t.anonymous,t.id),'anonymous',t.anonymous,
    'is_mine',t.author_id=v,'pinned',t.pinned,'locked',t.locked,'created_at',t.created_at,'edited_at',t.edited_at,
    'last_activity',t.last_activity,'reply_count',(select count(*) from cgc_forum.replies r where r.topic_id=t.id));
$$;
create function cgc_forum.reply_json(r cgc_forum.replies,v uuid) returns jsonb language sql stable security definer set search_path='' as $$
  select case when r.hidden or r.deleted then jsonb_build_object('id',r.id,'body','This reply is no longer available.','author_label','Removed','anonymous',true,'is_mine',false,'created_at',r.created_at,'edited_at',null,'removed',true)
  else jsonb_build_object('id',r.id,'body',r.body,'author_label',cgc_forum.author_label(r.author_id,r.anonymous,r.topic_id),'anonymous',r.anonymous,'is_mine',r.author_id=v,'created_at',r.created_at,'edited_at',r.edited_at,'removed',false) end;
$$;

create function public.cgc_forum_profile() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=cgc_forum.member(); n text;
begin select display_name into n from cgc_forum.members where id=u; return jsonb_build_object('display_name',n,'name_ready',n<>'Graduate student'); end $$;
create function public.cgc_forum_set_profile(p_name text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=cgc_forum.member(); n text:=regexp_replace(trim(p_name),'\s+',' ','g');
begin
  if n is null or char_length(n) not between 2 and 60 or n ~* '\m(admin|administrator|moderator|anonymous|official)\M' or lower(n)='graduate student' then raise exception 'Choose a personal display name of 2–60 characters without staff labels.'; end if;
  perform cgc_forum.rate_limit(u,'profile',10,3600);
  update cgc_forum.members set display_name=n where id=u;
  return jsonb_build_object('display_name',n,'name_ready',true);
exception when unique_violation then raise exception 'This display name is already in use. Choose another.';
end $$;
create function public.cgc_forum_feed(p_category text default '',p_search text default '',p_sort text default 'active',p_page integer default 1) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=cgc_forum.member(); result jsonb; total integer; q text:=left(trim(coalesce(p_search,'')),120); pg integer:=greatest(1,least(coalesce(p_page,1),500));
begin
  select count(*) into total from cgc_forum.topics t where not t.deleted and not t.hidden and (coalesce(p_category,'')='' or t.category=p_category)
    and (q='' or to_tsvector('english',t.title||' '||t.body) @@ plainto_tsquery('english',q));
  select coalesce(jsonb_agg(cgc_forum.topic_json(x,u) order by x.pinned desc,case when p_sort='newest' then x.created_at else x.last_activity end desc,x.id desc),'[]'::jsonb) into result
  from (select t.* from cgc_forum.topics t where not t.deleted and not t.hidden and (coalesce(p_category,'')='' or t.category=p_category)
    and (q='' or to_tsvector('english',t.title||' '||t.body) @@ plainto_tsquery('english',q))
    order by t.pinned desc,case when p_sort='newest' then t.created_at else t.last_activity end desc,t.id desc limit 20 offset (pg-1)*20) x;
  return jsonb_build_object('topics',result,'total',total,'page',pg);
end $$;
create function public.cgc_forum_discussion(p_id uuid,p_page integer default 1) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=cgc_forum.member(); t cgc_forum.topics; result jsonb; total integer; pg integer:=greatest(1,least(coalesce(p_page,1),500));
begin
  select * into t from cgc_forum.topics where id=p_id and not deleted and not hidden;
  if not found then return null; end if;
  select count(*) into total from cgc_forum.replies where topic_id=p_id;
  select coalesce(jsonb_agg(cgc_forum.reply_json(x,u) order by x.created_at,x.id),'[]'::jsonb) into result
  from (select * from cgc_forum.replies where topic_id=p_id order by created_at,id limit 50 offset (pg-1)*50) x;
  return jsonb_build_object('topic',cgc_forum.topic_json(t,u,true),'replies',result,'total',total,'page',pg);
end $$;
create function public.cgc_forum_create_topic(p_title text,p_body text,p_category text,p_anonymous boolean,p_request uuid default gen_random_uuid()) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=cgc_forum.member(); result uuid;
begin
  if p_title is null or char_length(trim(p_title)) not between 4 and 160 or p_body is null or char_length(trim(p_body)) not between 2 and 8000 then raise exception 'Enter a title of 4–160 characters and a message of 2–8000 characters.'; end if;
  if p_category is null or p_category not in ('general','research','events','opportunities','help','introductions') or p_anonymous is null then raise exception 'Choose a channel and posting identity.'; end if;
  if exists(select 1 from cgc_forum.members where id=u and display_name='Graduate student') then raise exception 'Choose your display name before posting.'; end if;
  if p_request is null then raise exception 'Please retry your message.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text,0));
  select id into result from cgc_forum.topics where author_id=u and request_id=p_request;
  if found then return result; end if;
  perform cgc_forum.rate_limit(u,'post',5,60);
  insert into cgc_forum.topics(author_id,title,body,category,anonymous,request_id) values(u,trim(p_title),trim(p_body),p_category,p_anonymous,p_request) returning id into result;
  return result;
end $$;
create function public.cgc_forum_create_reply(p_topic uuid,p_body text,p_anonymous boolean,p_request uuid default gen_random_uuid()) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=cgc_forum.member(); t cgc_forum.topics; result uuid; n integer;
begin
  if p_body is null or char_length(trim(p_body)) not between 2 and 8000 or p_anonymous is null then raise exception 'Enter a message of 2–8000 characters and choose a posting identity.'; end if;
  if exists(select 1 from cgc_forum.members where id=u and display_name='Graduate student') then raise exception 'Choose your display name before posting.'; end if;
  if p_request is null then raise exception 'Please retry your message.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text,0));
  select id into result from cgc_forum.replies where author_id=u and request_id=p_request and topic_id=p_topic;
  if found then
    select count(*) into n from cgc_forum.replies where topic_id=p_topic;
    return jsonb_build_object('id',result,'page',greatest(1,ceil(n/50.0)::integer));
  end if;
  perform cgc_forum.rate_limit(u,'post',5,60);
  select * into t from cgc_forum.topics where id=p_topic for update;
  if not found or t.hidden or t.deleted then raise exception 'This discussion is no longer available.'; end if;
  if t.locked then raise exception 'This discussion is closed to new replies.'; end if;
  insert into cgc_forum.replies(topic_id,author_id,body,anonymous,request_id) values(p_topic,u,trim(p_body),p_anonymous,p_request) returning id into result;
  update cgc_forum.topics set last_activity=now() where id=p_topic;
  select count(*) into n from cgc_forum.replies where topic_id=p_topic;
  return jsonb_build_object('id',result,'page',greatest(1,ceil(n/50.0)::integer));
end $$;
create function public.cgc_forum_edit(p_kind text,p_id uuid,p_body text,p_version timestamptz,p_title text default null,p_anonymous boolean default false) returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=cgc_forum.member(); t cgc_forum.topics; r cgc_forum.replies;
begin
  if p_body is null or char_length(trim(p_body)) not between 2 and 8000 or p_anonymous is null then raise exception 'Enter a message of 2–8000 characters.'; end if;
  perform cgc_forum.rate_limit(u,'edit',10,60);
  if p_kind='topic' then
    select * into t from cgc_forum.topics where id=p_id for update;
    if not found or t.author_id<>u or t.hidden or t.deleted or t.locked then raise exception 'You cannot edit this discussion.'; end if;
    if p_version is null or p_version<>coalesce(t.edited_at,t.created_at) then raise exception 'This post changed. Refresh before editing again.'; end if;
    if p_title is null or char_length(trim(p_title)) not between 4 and 160 then raise exception 'Enter a title of 4–160 characters.'; end if;
    insert into cgc_forum.audit(actor,action,target_id,before_content) values(u::text,'edit-topic',p_id,to_jsonb(t));
    update cgc_forum.topics set body=trim(p_body),title=trim(p_title),anonymous=p_anonymous,edited_at=now() where id=p_id;
  elsif p_kind='reply' then
    select * into r from cgc_forum.replies where id=p_id;
    if not found or r.author_id<>u or r.hidden or r.deleted then raise exception 'You cannot edit this reply.'; end if;
    select * into t from cgc_forum.topics where id=r.topic_id for update;
    if t.hidden or t.deleted or t.locked then raise exception 'This discussion is closed.'; end if;
    select * into r from cgc_forum.replies where id=p_id for update;
    if r.author_id<>u or r.hidden or r.deleted then raise exception 'You cannot edit this reply.'; end if;
    if p_version is null or p_version<>coalesce(r.edited_at,r.created_at) then raise exception 'This post changed. Refresh before editing again.'; end if;
    insert into cgc_forum.audit(actor,action,target_id,before_content) values(u::text,'edit-reply',p_id,to_jsonb(r));
    update cgc_forum.replies set body=trim(p_body),anonymous=p_anonymous,edited_at=now() where id=p_id;
  else raise exception 'Choose a discussion or reply.'; end if;
end $$;
create function public.cgc_forum_delete(p_kind text,p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=cgc_forum.member(); item jsonb;
begin
  perform cgc_forum.rate_limit(u,'delete',30,3600);
  if p_kind='topic' then
    select to_jsonb(t) into item from cgc_forum.topics t where id=p_id and author_id=u and not deleted for update;
    if item is null then raise exception 'You cannot remove this discussion.'; end if;
    update cgc_forum.topics set deleted=true where id=p_id;
  elsif p_kind='reply' then
    select to_jsonb(r) into item from cgc_forum.replies r where id=p_id and author_id=u and not deleted for update;
    if item is null then raise exception 'You cannot remove this reply.'; end if;
    update cgc_forum.replies set deleted=true where id=p_id;
  else raise exception 'Choose a discussion or reply.'; end if;
  insert into cgc_forum.audit(actor,action,target_id,before_content) values(u::text,'delete-'||p_kind,p_id,item);
end $$;
create function public.cgc_forum_report(p_kind text,p_id uuid,p_reason text) returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=cgc_forum.member(); valid boolean:=false;
begin
  if p_reason is null or char_length(trim(p_reason)) not between 5 and 1000 then raise exception 'Enter a report reason of 5–1000 characters.'; end if;
  if p_kind='topic' then select exists(select 1 from cgc_forum.topics where id=p_id and not deleted and not hidden) into valid;
  elsif p_kind='reply' then select exists(select 1 from cgc_forum.replies r join cgc_forum.topics t on t.id=r.topic_id where r.id=p_id and not r.deleted and not r.hidden and not t.deleted and not t.hidden) into valid; end if;
  if not valid then raise exception 'This post is no longer available.'; end if;
  perform cgc_forum.rate_limit(u,'report',10,3600);
  insert into cgc_forum.reports(reporter_id,kind,target_id,reason) values(u,p_kind,p_id,trim(p_reason)) on conflict(reporter_id,kind,target_id) do nothing;
end $$;

-- Only a server with the secret/service key can call moderation RPCs.
create function public.cgc_forum_moderation_queue(p_status text default 'open') returns jsonb language sql security definer set search_path='' as $$
  select coalesce(jsonb_agg(x order by x->>'created_at'),'[]'::jsonb) from (
    select jsonb_build_object('id',r.id,'kind',r.kind,'target_id',r.target_id,'topic_id',coalesce(t.id,rt.id),'reason',r.reason,'created_at',r.created_at,'status',r.status,
      'reporter_email',reporter.email,'author_email',author.email,'author_id',coalesce(t.author_id,p.author_id),'body',coalesce(t.body,p.body),'title',coalesce(t.title,rt.title),
      'hidden',coalesce(t.hidden,p.hidden,false),'banned',coalesce(m.banned,false)) x
    from cgc_forum.reports r
    left join cgc_forum.topics t on r.kind='topic' and t.id=r.target_id
    left join cgc_forum.replies p on r.kind='reply' and p.id=r.target_id
    left join cgc_forum.topics rt on rt.id=p.topic_id
    left join auth.users reporter on reporter.id=r.reporter_id
    left join auth.users author on author.id=coalesce(t.author_id,p.author_id)
    left join cgc_forum.members m on m.id=author.id
    where r.status=p_status order by r.created_at limit 100
  ) q;
$$;
create function public.cgc_forum_moderate(p_kind text,p_id uuid,p_action text,p_actor text) returns void language plpgsql security definer set search_path='' as $$
declare item jsonb;
begin
  if p_actor is null or char_length(p_actor) not between 1 and 200 then raise exception 'Sign in as a moderator.'; end if;
  if p_kind='topic' then
    select to_jsonb(t) into item from cgc_forum.topics t where id=p_id for update;
    if item is null then raise exception 'This discussion is unavailable.'; end if;
    if p_action='hide' then update cgc_forum.topics set hidden=true where id=p_id;
    elsif p_action='restore' then update cgc_forum.topics set hidden=false where id=p_id;
    elsif p_action='lock' then update cgc_forum.topics set locked=true where id=p_id;
    elsif p_action='unlock' then update cgc_forum.topics set locked=false where id=p_id;
    elsif p_action='pin' then update cgc_forum.topics set pinned=true where id=p_id;
    elsif p_action='unpin' then update cgc_forum.topics set pinned=false where id=p_id;
    else raise exception 'Choose a moderation action.'; end if;
  elsif p_kind='reply' then
    select to_jsonb(r) into item from cgc_forum.replies r where id=p_id for update;
    if item is null then raise exception 'This reply is unavailable.'; end if;
    if p_action='hide' then update cgc_forum.replies set hidden=true where id=p_id;
    elsif p_action='restore' then update cgc_forum.replies set hidden=false where id=p_id;
    else raise exception 'Choose hide or restore for a reply.'; end if;
  else raise exception 'Choose a discussion or reply.'; end if;
  insert into cgc_forum.audit(actor,action,target_id,before_content) values(p_actor,p_action||'-'||p_kind,p_id,item);
end $$;
create function public.cgc_forum_resolve_report(p_id uuid,p_actor text) returns void language plpgsql security definer set search_path='' as $$
begin
  update cgc_forum.reports set status='resolved' where id=p_id;
  insert into cgc_forum.audit(actor,action,target_id) values(p_actor,'resolve-report',p_id);
end $$;
create function public.cgc_forum_suspend(p_member uuid,p_suspended boolean,p_actor text) returns void language plpgsql security definer set search_path='' as $$
begin
  update cgc_forum.members set banned=p_suspended where id=p_member;
  insert into cgc_forum.audit(actor,action,target_id) values(p_actor,case when p_suspended then 'suspend' else 'reinstate' end,p_member);
end $$;
create function public.cgc_forum_handle_report(p_report uuid,p_action text,p_actor text) returns void language plpgsql security definer set search_path='' as $$
declare r cgc_forum.reports; author uuid;
begin
  select * into r from cgc_forum.reports where id=p_report for update;
  if not found then raise exception 'This report is no longer available.'; end if;
  if p_action in ('hide','restore') then perform public.cgc_forum_moderate(r.kind,r.target_id,p_action,p_actor);
  elsif p_action='suspend' then
    if r.kind='topic' then select author_id into author from cgc_forum.topics where id=r.target_id;
    else select author_id into author from cgc_forum.replies where id=r.target_id; end if;
    if author is null then raise exception 'This account is no longer available.'; end if;
    perform public.cgc_forum_suspend(author,true,p_actor);
  elsif p_action<>'resolve' then raise exception 'Choose a report action.'; end if;
  perform public.cgc_forum_resolve_report(p_report,p_actor);
end $$;

revoke all on all functions in schema cgc_forum from public,anon,authenticated,service_role;
do $$ declare f record; begin
  for f in select p.oid::regprocedure as signature,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'cgc_forum_%' loop
    execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
    if f.proname in ('cgc_forum_moderation_queue','cgc_forum_moderate','cgc_forum_resolve_report','cgc_forum_suspend','cgc_forum_handle_report') then
      execute format('grant execute on function %s to service_role',f.signature);
    else execute format('grant execute on function %s to authenticated',f.signature); end if;
  end loop;
end $$;
commit;
