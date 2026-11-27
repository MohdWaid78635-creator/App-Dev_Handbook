begin;
create extension if not exists pgtap with schema extensions;
select plan(3);
select has_function('public','apply_sync_mutation',array['jsonb'],'Conditional write RPC exists');
select has_function('public','commit_workspace_batch',array['jsonb'],'Transactional batch RPC exists');
select has_function('public','workspace_snapshot',array['jsonb'],'Consistent owner snapshot RPC exists');
select * from finish();
rollback;
