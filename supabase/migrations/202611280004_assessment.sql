-- Extend project payloads without changing existing constraints or public RPCs.
create function buildwisp_private.valid_payload_base_v1(kind text, j jsonb)
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


create function buildwisp_private.valid_assessment(j jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare k text; v jsonb;
begin
 if not buildwisp_private.keys(j,array['version','mode','stage','goal','accounts','checks'])
  or j->'version'<>'1'::jsonb
  or not coalesce(j->>'mode'=any(array['new','existing']),false)
  or not coalesce(j->>'stage'=any(array['screens','building','testing','live','unknown']),false)
  or not coalesce(j->>'goal'=any(array['feature','release','repair','security','performance','costs','live']),false)
  or not coalesce(j->>'accounts'=any(array['private','local','unknown']),false)
  or not buildwisp_private.keys(j->'checks',array['running','journey','data','access','test','recovery']) then return false; end if;
 for k,v in select * from jsonb_each(j->'checks') loop
  if jsonb_typeof(v)<>'string' or not coalesce(v#>>'{}'=any(array['yes','no','unsure','na']),false)
   or (v='"na"'::jsonb and k<>all(array['data','recovery'])) then return false; end if;
 end loop;
 return true;
exception when others then return false;
end $$;

create or replace function buildwisp_private.valid_payload(kind text, j jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
begin
 if j is null or octet_length(j::text)>262144 then return false; end if;
 if kind='project' and j ? 'assessment' then
  return buildwisp_private.valid_assessment(j->'assessment')
   and buildwisp_private.valid_payload_base_v1(kind,j-'assessment');
 end if;
 return buildwisp_private.valid_payload_base_v1(kind,j);
exception when others then return false;
end $$;

revoke all on function buildwisp_private.valid_assessment(jsonb) from public,anon,authenticated;
revoke all on function buildwisp_private.valid_payload_base_v1(text,jsonb) from public,anon,authenticated;
