create schema buildwisp_private;
revoke all on schema buildwisp_private from public, anon, authenticated;
alter default privileges in schema buildwisp_private revoke execute on functions from public;

create function buildwisp_private.keys(j jsonb, required text[], allowed text[] default null)
returns boolean language plpgsql immutable set search_path = '' as $$
begin
 if jsonb_typeof(j) is distinct from 'object' then return false; end if;
 return j ?& required and not exists(select 1 from jsonb_object_keys(j) k where not(k=any(coalesce(allowed,required))));
end $$;
create function buildwisp_private.int(j jsonb, minimum numeric default 0)
returns boolean language plpgsql immutable set search_path = '' as $$
begin
  return coalesce(jsonb_typeof(j)='number' and (j::text)::numeric between minimum and 9007199254740991
    and trunc((j::text)::numeric)=(j::text)::numeric,false);
exception when others then return false; end $$;
create function buildwisp_private.txt(j jsonb, maximum integer default 16000, nonempty boolean default true)
returns boolean language sql immutable set search_path = '' as $$
 select coalesce(jsonb_typeof(j)='string' and length(j#>>'{}')<=maximum and
   (not nonempty or length(btrim(j#>>'{}'))>0),false)
$$;
create function buildwisp_private.uuid(j jsonb) returns boolean language sql immutable set search_path = '' as $$
 select coalesce(jsonb_typeof(j)='string' and (j#>>'{}') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',false)
$$;
create function buildwisp_private.day(j jsonb) returns boolean language plpgsql immutable set search_path = '' as $$
begin return buildwisp_private.txt(j,10) and (j#>>'{}') ~ '^\d{4}-\d{2}-\d{2}$'
  and to_char((j#>>'{}')::date,'YYYY-MM-DD')=j#>>'{}';
exception when others then return false; end $$;
create function buildwisp_private.strings(j jsonb) returns boolean language plpgsql immutable set search_path = '' as $$
begin
 if jsonb_typeof(j) is distinct from 'array' then return false; end if;
 return not exists(select 1 from jsonb_array_elements(j) x where not buildwisp_private.txt(x))
   and (select count(*)=count(distinct x) from jsonb_array_elements(j) x);
end $$;

create function buildwisp_private.valid_payload(kind text, j jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare x jsonb; y jsonb; k text; r jsonb;
begin
 if j is null or octet_length(j::text)>262144 then return false; end if;
 if kind='learning' then
  if not buildwisp_private.keys(j,array['checkpoints','openedMissions','quizResults'])
   or not buildwisp_private.strings(j->'checkpoints') or jsonb_typeof(j->'openedMissions')<>'array'
   or jsonb_typeof(j->'quizResults')<>'array' then return false; end if;
  if exists(select 1 from jsonb_array_elements_text(j->'checkpoints') v(value) where v.value<>all(array['tools','first-edit','git-checkpoint','habit-lab']))
   or exists(select 1 from jsonb_array_elements(j->'openedMissions') v(value) where not buildwisp_private.int(v.value))
   or (select count(*)<>count(distinct v.value) from jsonb_array_elements(j->'openedMissions') v(value))
   or (select count(*)<>count(distinct v.value->>'id') from jsonb_array_elements(j->'quizResults') v(value)) then return false; end if;
  for x in select * from jsonb_array_elements(j->'quizResults') loop
   if not buildwisp_private.keys(x,array['id','firstCorrectAt','missed'],array['id','firstCorrectAt','missed','reviewDueAt'])
    or not buildwisp_private.txt(x->'id') or jsonb_typeof(x->'missed')<>'boolean'
    or (x->'firstCorrectAt'<>'null'::jsonb and not buildwisp_private.int(x->'firstCorrectAt'))
    or (x ? 'reviewDueAt' and (x->'firstCorrectAt'='null'::jsonb or not buildwisp_private.int(x->'reviewDueAt'))) then return false; end if;
  end loop;
 elsif kind='study' then
  if not buildwisp_private.keys(j,array['daily','cards']) or jsonb_typeof(j->'daily')<>'array' or jsonb_typeof(j->'cards')<>'array' then return false; end if;
  if (select count(*)<>count(distinct v.value->>'day') from jsonb_array_elements(j->'daily') v(value))
   or (select count(*)<>count(distinct v.value->>'id') from jsonb_array_elements(j->'cards') v(value)) then return false; end if;
  for x in select * from jsonb_array_elements(j->'daily') loop
   if not buildwisp_private.keys(x,array['day','id','pick']) or not buildwisp_private.day(x->'day')
    or not buildwisp_private.txt(x->'id') or not buildwisp_private.int(x->'pick') then return false; end if;
  end loop;
  for x in select * from jsonb_array_elements(j->'cards') loop
   if not buildwisp_private.keys(x,array['id','level','due']) or not buildwisp_private.txt(x->'id')
    or not buildwisp_private.int(x->'level') or (x->>'level')::numeric>4 or not buildwisp_private.day(x->'due') then return false; end if;
  end loop;
 elsif kind='project' then
  if not buildwisp_private.keys(j,array['name','audience','goal'],array['name','audience','goal','plan','build','milestones'])
   or not buildwisp_private.txt(j->'name',80) or not buildwisp_private.txt(j->'audience',160,false)
   or not buildwisp_private.txt(j->'goal',600,false) then return false; end if;
  if j ? 'plan' then
   if jsonb_typeof(j->'plan')<>'object' then return false; end if;
   for x in select value from jsonb_each(j->'plan') loop
    if not buildwisp_private.txt(x,1000,false) then return false; end if;
   end loop;
  end if;
  if j ? 'milestones' then
   if jsonb_typeof(j->'milestones')<>'object' then return false; end if;
   for k,x in select * from jsonb_each(j->'milestones') loop
    if k<>all(array['1','6','8','11']) or not buildwisp_private.txt(x,1200) then return false; end if;
   end loop;
  end if;
  if j ? 'build' then
   if jsonb_typeof(j->'build')<>'object' then return false; end if;
   for k,x in select * from jsonb_each(j->'build') loop
    if k !~ '^s\d+-step\d+$' or not buildwisp_private.keys(x,array['checked'],array['checked','skipReason'])
     or not buildwisp_private.strings(x->'checked') then return false; end if;
    if x ? 'skipReason' and (k<>all(array['s7-step2','s7-step3','s7-step4','s9-step4'])
     or not buildwisp_private.txt(x->'skipReason',300)) then return false; end if;
   end loop;
  end if;
 elsif kind='readiness' then
  if not buildwisp_private.keys(j,array['projectId','review']) or not buildwisp_private.uuid(j->'projectId') then return false; end if;
  r:=j->'review';
  if not buildwisp_private.keys(r,array['build','items']) or not buildwisp_private.txt(r->'build',120)
   or btrim(r->>'build')<>r->>'build' or jsonb_typeof(r->'items')<>'object' then return false; end if;
  for k,x in select * from jsonb_each(r->'items') loop
   if k !~ '^[a-z][a-z-]*:\d+$' or not buildwisp_private.keys(x,array['status','evidence'])
    or not coalesce(x->>'status'=any(array['pending','passed','blocked','na']),false)
    or not buildwisp_private.txt(x->'evidence',1000,x->>'status'<>'pending') then return false; end if;
  end loop;
 else return false;
 end if;
 return true;
exception when others then return false;
end $$;

create table public.user_workspaces (
 user_id uuid primary key references auth.users(id) on delete cascade,
 revision bigint not null default 0 check(revision between 0 and 9007199254740991),
 epoch bigint not null default 0 check(epoch between 0 and 9007199254740991)
);
create table public.learning_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null check(buildwisp_private.valid_payload('learning',payload)),
 revision bigint not null check(revision between 1 and 9007199254740991)
);
create table public.study_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null check(buildwisp_private.valid_payload('study',payload)),
 revision bigint not null check(revision between 1 and 9007199254740991)
);
create table public.projects (
 user_id uuid not null references auth.users(id) on delete cascade, id uuid not null,
 payload jsonb, revision bigint not null check(revision between 1 and 9007199254740991), deleted_at timestamptz,
 primary key(user_id,id),
 check((deleted_at is not null and payload is null) or (deleted_at is null and payload is not null and buildwisp_private.valid_payload('project',payload)))
);
create table public.release_reviews (
 user_id uuid not null, id uuid not null, project_id uuid not null, build text not null,
 payload jsonb, revision bigint not null check(revision between 1 and 9007199254740991), deleted_at timestamptz,
 primary key(user_id,id), unique(user_id,project_id,build),
 foreign key(user_id,project_id) references public.projects(user_id,id) on delete cascade,
 check((deleted_at is not null and payload is null) or (deleted_at is null and payload is not null and
  buildwisp_private.valid_payload('readiness',payload) and payload->>'projectId'=project_id::text and payload->'review'->>'build'=build))
);
create table public.sync_receipts (
 user_id uuid not null references auth.users(id) on delete cascade, operation_id uuid not null,
 request jsonb not null, response jsonb not null, primary key(user_id,operation_id)
);
create table public.guest_imports (
 user_id uuid not null references auth.users(id) on delete cascade, dataset_id uuid not null,
 operation_id uuid not null, primary key(user_id,dataset_id),
 foreign key(user_id,operation_id) references public.sync_receipts(user_id,operation_id)
);

do $$ declare tab text; begin
 foreach tab in array array['user_workspaces','learning_state','study_state','projects','release_reviews','sync_receipts','guest_imports'] loop
  execute format('alter table public.%I enable row level security',tab);
  execute format('revoke all on public.%I from public, anon, authenticated',tab);
  execute format('grant select on public.%I to authenticated',tab);
  execute format('create policy owner_read on public.%I for select to authenticated using ((select auth.uid())=user_id)',tab);
 end loop;
end $$;

create function buildwisp_private.record_for(actor uuid, kind text, entity text) returns jsonb
language plpgsql stable set search_path = '' as $$
declare p jsonb; rev bigint; deleted timestamptz; ws bigint;
begin
 select revision into ws from public.user_workspaces where user_id=actor;
 case kind
 when 'learning' then select payload,revision into p,rev from public.learning_state where user_id=actor;
 when 'study' then select payload,revision into p,rev from public.study_state where user_id=actor;
 when 'project' then select payload,revision,deleted_at into p,rev,deleted from public.projects where user_id=actor and id=entity::uuid;
 when 'readiness' then select payload,revision,deleted_at into p,rev,deleted from public.release_reviews where user_id=actor and id=entity::uuid;
 else return null;
 end case;
 if rev is null then return null; end if;
 return jsonb_build_object('schemaVersion',1,'ownerId',actor,'kind',kind,'entityId',entity,'revision',rev,'workspaceRevision',ws,
  'payload',p,'deletedAt',case when deleted is null then null else to_char(deleted at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') end);
end $$;

create function public.workspace_snapshot(request jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid:=auth.uid(); ws bigint; generation bigint; records jsonb;
begin
 if actor is null then raise insufficient_privilege using message='Sign in required'; end if;
 if request<>'{}'::jsonb then raise invalid_parameter_value using message='Invalid snapshot request'; end if;
 insert into public.user_workspaces(user_id) values(actor) on conflict do nothing;
 select revision,epoch into ws,generation from public.user_workspaces where user_id=actor for share;
 select coalesce(jsonb_agg(buildwisp_private.record_for(actor,kind,entity) order by kind,entity),'[]'::jsonb) into records from (
  select 'learning'::text kind,'singleton'::text entity from public.learning_state where user_id=actor union all
  select 'study','singleton' from public.study_state where user_id=actor union all
  select 'project',id::text from public.projects where user_id=actor union all
  select 'readiness',id::text from public.release_reviews where user_id=actor
 ) rows;
 return jsonb_build_object('schemaVersion',1,'workspaceRevision',ws,'workspaceEpoch',generation,'records',records);
end $$;

create function public.apply_sync_mutation(request jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid:=auth.uid(); old jsonb; prior record; ws bigint; kind text:=request->>'kind'; entity text:=request->>'entityId';
 op uuid; p jsonb:=request->'payload'; rev bigint; generation bigint; response jsonb; del timestamptz; project uuid; build_name text;
 rejected jsonb:=jsonb_build_object('schemaVersion',1,'operationId',request->>'operationId','status','rejected','code','invalid');
begin
 if actor is null or request->>'ownerId' is distinct from actor::text then raise insufficient_privilege using message='Invalid owner'; end if;
 if not buildwisp_private.keys(request,array['schemaVersion','ownerId','operationId','kind','entityId','baseRevision','workspaceEpoch','action','payload'])
  or request->'schemaVersion' is distinct from '1'::jsonb or not buildwisp_private.uuid(request->'operationId') or not buildwisp_private.int(request->'baseRevision')
  or not buildwisp_private.int(request->'workspaceEpoch') or not coalesce(kind=any(array['learning','study','project','readiness']),false)
  or not coalesce(request->>'action'=any(array['upsert','delete']),false) or octet_length(request::text)>262144 then return rejected; end if;
 if (kind in ('learning','study') and entity is distinct from 'singleton') or (kind in ('project','readiness') and not buildwisp_private.uuid(request->'entityId')) then return rejected; end if;
 if request->>'action'='delete' then
  if kind not in ('project','readiness') or request->'baseRevision'='0'::jsonb or p<>'null'::jsonb then return rejected; end if;
 elsif request->>'action'<>'upsert' or not buildwisp_private.valid_payload(kind,p) then return rejected; end if;
 op:=(request->>'operationId')::uuid;
 insert into public.user_workspaces(user_id) values(actor) on conflict do nothing;
 select revision,epoch into ws,generation from public.user_workspaces where user_id=actor for update;
 select * into prior from public.sync_receipts where user_id=actor and operation_id=op;
 if found then
  if prior.request<>request then raise invalid_parameter_value using message='Operation ID reused with different request'; end if;
  return prior.response;
 end if;
 if (request->>'workspaceEpoch')::bigint<>generation then return rejected||'{"code":"stale_workspace"}'::jsonb; end if;
 old:=buildwisp_private.record_for(actor,kind,entity); rev:=(request->>'baseRevision')::bigint;
 if coalesce((old->>'revision')::bigint,0)<>rev then
  if old is null or (old->>'revision')::bigint<rev then return rejected; end if;
  return jsonb_build_object('schemaVersion',1,'operationId',op,'status','conflict','current',old);
 end if;
 if request->>'action'='delete' then del:=clock_timestamp(); p:=null; end if;
 if kind='readiness' and del is null then
  project:=(p->>'projectId')::uuid; build_name:=p->'review'->>'build';
  if not exists(select 1 from public.projects where user_id=actor and id=project and deleted_at is null)
   or exists(select 1 from public.release_reviews r where r.user_id=actor and r.id=entity::uuid and (r.project_id<>project or r.build<>build_name)) then return rejected; end if;
 end if;
 begin
  ws:=ws+1;
  update public.user_workspaces set revision=ws where user_id=actor;
  case kind
  when 'learning' then insert into public.learning_state values(actor,p,ws) on conflict(user_id) do update set payload=excluded.payload,revision=excluded.revision;
  when 'study' then insert into public.study_state values(actor,p,ws) on conflict(user_id) do update set payload=excluded.payload,revision=excluded.revision;
  when 'project' then
   insert into public.projects values(actor,entity::uuid,p,ws,del) on conflict(user_id,id) do update set payload=excluded.payload,revision=excluded.revision,deleted_at=excluded.deleted_at;
   if del is not null then update public.release_reviews set payload=null,deleted_at=del,revision=ws where user_id=actor and project_id=entity::uuid and deleted_at is null; end if;
  when 'readiness' then
   if del is null then insert into public.release_reviews values(actor,entity::uuid,project,build_name,p,ws,null)
    on conflict(user_id,id) do update set payload=excluded.payload,revision=excluded.revision,deleted_at=null;
   else update public.release_reviews set payload=null,revision=ws,deleted_at=del where user_id=actor and id=entity::uuid; end if;
  end case;
  if (select coalesce(sum(octet_length(payload::text)),0) from (
    select payload from public.learning_state where user_id=actor union all select payload from public.study_state where user_id=actor
    union all select payload from public.projects where user_id=actor union all select payload from public.release_reviews where user_id=actor
  ) data)>8388608 then raise program_limit_exceeded using message='Workspace quota'; end if;
  response:=jsonb_build_object('schemaVersion',1,'operationId',op,'status','applied','record',buildwisp_private.record_for(actor,kind,entity));
  insert into public.sync_receipts values(actor,op,request,response);
  return response;
 exception when unique_violation or check_violation or foreign_key_violation then return rejected;
  when program_limit_exceeded then return rejected||'{"code":"quota"}'::jsonb;
 end;
end $$;

revoke all on function public.workspace_snapshot(jsonb), public.apply_sync_mutation(jsonb) from public, anon, authenticated;
grant execute on function public.workspace_snapshot(jsonb), public.apply_sync_mutation(jsonb) to authenticated;
revoke all on all functions in schema buildwisp_private from public, anon, authenticated;
