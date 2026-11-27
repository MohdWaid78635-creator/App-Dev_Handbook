create function public.commit_workspace_batch(request jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid:=auth.uid(); ws bigint; prior record; mode text:=request->>'mode'; op uuid; item jsonb; result jsonb;
 receipt jsonb; mapping jsonb; local_ids bigint[]:='{}'; cloud_ids uuid[]:='{}'; seen text[]:='{}'; key text;
begin
 if actor is null or request->>'ownerId' is distinct from actor::text then raise insufficient_privilege using message='Invalid owner'; end if;
 if not buildwisp_private.keys(request,array['schemaVersion','ownerId','operationId','mode','expectedWorkspaceRevision','mappings','mutations'],
   array['schemaVersion','ownerId','operationId','mode','expectedWorkspaceRevision','mappings','mutations','guestDatasetId'])
   or request->'schemaVersion' is distinct from '1'::jsonb or not buildwisp_private.uuid(request->'operationId')
   or not buildwisp_private.int(request->'expectedWorkspaceRevision') or not coalesce(mode=any(array['import','replace']),false)
   or jsonb_typeof(request->'mappings') is distinct from 'array' or jsonb_typeof(request->'mutations') is distinct from 'array'
   or octet_length(request::text)>8388608 then raise invalid_parameter_value using message='Invalid batch'; end if;
 if mode='import' and not buildwisp_private.uuid(request->'guestDatasetId') then raise invalid_parameter_value using message='Invalid import dataset'; end if;
 if mode='replace' and request ? 'guestDatasetId' then raise invalid_parameter_value using message='Unexpected import dataset'; end if;
 op:=(request->>'operationId')::uuid;
 insert into public.user_workspaces(user_id) values(actor) on conflict do nothing;
 select revision into ws from public.user_workspaces where user_id=actor for update;
 select * into prior from public.sync_receipts where user_id=actor and operation_id=op;
 if found then
  if prior.request<>request then raise invalid_parameter_value using message='Operation ID reused with different batch'; end if;
  return prior.response;
 end if;
 if mode='import' and exists(select 1 from public.guest_imports where user_id=actor and dataset_id=(request->>'guestDatasetId')::uuid)
  then raise invalid_parameter_value using message='Guest dataset already imported'; end if;
 if ws<>(request->>'expectedWorkspaceRevision')::bigint then raise serialization_failure using message='Stale workspace revision'; end if;
 for mapping in select * from jsonb_array_elements(request->'mappings') loop
  if not buildwisp_private.keys(mapping,array['namespace','localProjectId','cloudProjectId'])
   or mapping->>'namespace' is distinct from 'user:'||actor::text or not buildwisp_private.int(mapping->'localProjectId',1)
   or not buildwisp_private.uuid(mapping->'cloudProjectId') then raise invalid_parameter_value using message='Invalid batch mapping'; end if;
  if (mapping->>'localProjectId')::bigint=any(local_ids) or (mapping->>'cloudProjectId')::uuid=any(cloud_ids)
   then raise invalid_parameter_value using message='Duplicate batch mapping'; end if;
  local_ids:=array_append(local_ids,(mapping->>'localProjectId')::bigint);
  cloud_ids:=array_append(cloud_ids,(mapping->>'cloudProjectId')::uuid);
 end loop;
 if (select count(*) from jsonb_array_elements(request->'mutations') x where x->>'kind'='project')<>cardinality(cloud_ids)
  then raise invalid_parameter_value using message='Incomplete project batch mapping'; end if;
 for item in select * from jsonb_array_elements(request->'mutations') loop
  key:=(item->>'kind')||':'||(item->>'entityId');
  if key is null or key=any(seen) or item->>'action' is distinct from 'upsert' or item->>'operationId'=op::text
   or (item->>'kind'='project' and not coalesce((item->>'entityId')::uuid=any(cloud_ids),false))
   then raise invalid_parameter_value using message='Invalid or duplicate batch entity'; end if;
  seen:=array_append(seen,key);
 end loop;
 if mode='replace' then
  -- Keep tombstones and increasing revisions so old devices cannot recreate removed projects.
  ws:=ws+1;
  update public.user_workspaces set revision=ws where user_id=actor;
  update public.projects set payload=null,deleted_at=clock_timestamp(),revision=ws where user_id=actor and deleted_at is null;
  update public.release_reviews set payload=null,deleted_at=clock_timestamp(),revision=ws where user_id=actor and deleted_at is null;
  delete from public.learning_state where user_id=actor;
  delete from public.study_state where user_id=actor;
 end if;
 -- Projects must exist before their reviews, regardless of the submitted order.
 for item in select x from jsonb_array_elements(request->'mutations') x order by case x->>'kind' when 'project' then 0 when 'readiness' then 2 else 1 end loop
  if mode='replace' then
   item:=jsonb_set(item,'{baseRevision}',coalesce(buildwisp_private.record_for(actor,item->>'kind',item->>'entityId')->'revision','0'::jsonb));
  end if;
  result:=public.apply_sync_mutation(item);
  if result->>'status'<>'applied' then raise invalid_parameter_value using message='Invalid or conflicting batch mutation'; end if;
 end loop;
 select revision into ws from public.user_workspaces where user_id=actor;
 receipt:=jsonb_build_object('schemaVersion',1,'operationId',op,'workspaceRevision',ws);
 if mode='import' then receipt:=receipt||jsonb_build_object('ownerId',actor,'guestDatasetId',request->>'guestDatasetId','mappings',request->'mappings'); end if;
 insert into public.sync_receipts values(actor,op,request,receipt);
 if mode='import' then insert into public.guest_imports values(actor,(request->>'guestDatasetId')::uuid,op); end if;
 return receipt;
end $$;
revoke all on function public.commit_workspace_batch(jsonb) from public,anon,authenticated;
grant execute on function public.commit_workspace_batch(jsonb) to authenticated;
