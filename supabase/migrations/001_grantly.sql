create table public.profiles(user_id uuid primary key references auth.users(id) on delete cascade, data jsonb not null default '{}'::jsonb, revision bigint not null default 0, updated_at timestamptz not null default now());
create table public.saved_scholarships(user_id uuid references auth.users(id) on delete cascade,scholarship_id integer not null,primary key(user_id,scholarship_id));
create table public.applications(user_id uuid references auth.users(id) on delete cascade,scholarship_id integer not null,status text not null,notes text not null default '',primary key(user_id,scholarship_id),check(length(notes)<=2000));
create table public.workspace_documents(user_id uuid references auth.users(id) on delete cascade,document_name text not null,primary key(user_id,document_name));
create table public.scholarships(id integer primary key,record jsonb not null,updated_at timestamptz not null default now());
alter table public.profiles enable row level security;
alter table public.saved_scholarships enable row level security;
alter table public.applications enable row level security;
alter table public.workspace_documents enable row level security;
alter table public.scholarships enable row level security;
create policy profile_owner on public.profiles for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy saved_owner on public.saved_scholarships for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy application_owner on public.applications for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy document_owner on public.workspace_documents for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy scholarship_read on public.scholarships for select to anon,authenticated using(true);
revoke all on public.scholarships from anon,authenticated;
grant select on public.scholarships to anon,authenticated;
grant select,insert,update,delete on public.profiles,public.saved_scholarships,public.applications,public.workspace_documents to authenticated;
create function public.load_workspace() returns jsonb language plpgsql security invoker set search_path=public as $$
declare uid uuid:=auth.uid();result jsonb;
begin
 if uid is null then raise exception 'Authentication required';end if;
 select jsonb_build_object('revision',coalesce((select revision from profiles where user_id=uid),0),'plan',jsonb_build_object('profile',coalesce((select data from profiles where user_id=uid),'{}'::jsonb),'saved',coalesce((select jsonb_agg(scholarship_id) from saved_scholarships where user_id=uid),'[]'::jsonb),'apps',coalesce((select jsonb_object_agg(scholarship_id,status) from applications where user_id=uid),'{}'::jsonb),'notes',coalesce((select jsonb_object_agg(scholarship_id,notes) from applications where user_id=uid),'{}'::jsonb),'docs',coalesce((select jsonb_agg(document_name) from workspace_documents where user_id=uid),'[]'::jsonb))) into result;
 return result;
end $$;
create function public.save_workspace(payload jsonb,expected_revision bigint) returns bigint language plpgsql security invoker set search_path=public as $$
declare uid uuid:=auth.uid();current_revision bigint;item jsonb;pair record;
begin
 if uid is null then raise exception 'Authentication required';end if;
 if expected_revision is null or expected_revision<0 then raise exception 'Invalid revision';end if;
 if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text)>100000 then raise exception 'Invalid workspace';end if;
 insert into profiles(user_id) values(uid) on conflict do nothing;
 select revision into current_revision from profiles where user_id=uid for update;
 if current_revision!=expected_revision then raise exception 'Workspace changed on another device. Load before saving.';end if;
 if jsonb_typeof(payload->'profile') is distinct from 'object' or jsonb_typeof(payload->'saved') is distinct from 'array' or jsonb_typeof(payload->'apps') is distinct from 'object' or jsonb_typeof(payload->'notes') is distinct from 'object' or jsonb_typeof(payload->'docs') is distinct from 'array' then raise exception 'Invalid workspace structure';end if;
 delete from saved_scholarships where user_id=uid;
 for item in select * from jsonb_array_elements(payload->'saved') loop insert into saved_scholarships values(uid,(item::text)::integer) on conflict do nothing;end loop;
 delete from applications where user_id=uid;
 for pair in select * from jsonb_each_text(payload->'apps') loop
 if pair.value not in ('Saved','Planning','In Progress','Preparing','Ready to submit','Submitted','Decision Pending','Awarded','Not selected') then raise exception 'Invalid status';end if;
 insert into applications values(uid,pair.key::integer,pair.value,left(coalesce(payload->'notes'->>pair.key,''),2000));end loop;
 delete from workspace_documents where user_id=uid;
 for pair in select jsonb_array_elements_text(payload->'docs') as name loop insert into workspace_documents values(uid,left(pair.name,100)) on conflict do nothing;end loop;
 update profiles set data=payload->'profile',revision=current_revision+1,updated_at=now() where user_id=uid;
 return current_revision+1;
end $$;
revoke all on function public.save_workspace(jsonb,bigint),public.load_workspace() from public,anon;
grant execute on function public.save_workspace(jsonb,bigint),public.load_workspace() to authenticated;

