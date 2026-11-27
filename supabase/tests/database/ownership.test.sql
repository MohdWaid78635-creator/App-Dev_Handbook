begin;
create extension if not exists pgtap with schema extensions;
select plan(4);
insert into auth.users(id) values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
insert into public.projects(user_id,id,payload,revision) values
 ('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-000000000001','{"name":"A","audience":"","goal":""}',1),
 ('22222222-2222-4222-8222-222222222222','aaaaaaaa-aaaa-4aaa-8aaa-000000000002','{"name":"B","audience":"","goal":""}',1);
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select is((select count(*)::integer from public.projects),1,'Owner sees only own project');
select is((select payload->>'name' from public.projects),'A','Other account payload is hidden');
select ok(not has_table_privilege('authenticated','public.projects','INSERT,UPDATE,DELETE,TRUNCATE'),'No direct client writes');
select ok(not has_function_privilege('anon','public.apply_sync_mutation(jsonb)','EXECUTE'),'Anonymous cannot call private mutation RPC');
select * from finish();
rollback;
