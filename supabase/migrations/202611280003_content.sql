create table public.content_releases (
 id uuid primary key, schema_version integer not null default 1 check(schema_version=1),
 minimum_reader_version integer not null check(minimum_reader_version>0),
 state text not null default 'draft' check(state in ('draft','published')), created_at timestamptz not null default now()
);
create table public.content_documents (
 release_id uuid not null references public.content_releases(id), kind text not null check(kind in ('missions','articles','glossary','readiness')),
 payload jsonb not null check(jsonb_typeof(payload)='array' and octet_length(payload::text)<=4194304), primary key(release_id,kind)
);
create table public.content_channels(name text primary key check(name='stable'),release_id uuid not null references public.content_releases(id));
alter table public.content_releases enable row level security;
alter table public.content_documents enable row level security;
alter table public.content_channels enable row level security;
revoke all on public.content_releases,public.content_documents,public.content_channels from public,anon,authenticated;
grant select on public.content_releases,public.content_documents,public.content_channels to anon,authenticated;
create policy published on public.content_releases for select to anon,authenticated using(state='published');
create policy published on public.content_documents for select to anon,authenticated using(exists(select 1 from public.content_releases r where r.id=release_id and r.state='published'));
create policy published on public.content_channels for select to anon,authenticated using(exists(select 1 from public.content_releases r where r.id=release_id and r.state='published'));

create function buildwisp_private.guard_content() returns trigger language plpgsql set search_path = '' as $$
declare release uuid; state text;
begin
 if tg_table_name='content_releases' then
  if tg_op<>'INSERT' and old.state='published' then raise check_violation using message='Published release is immutable'; end if;
  if tg_op<>'DELETE' and new.state='published' and
   (select count(*)<>4 or coalesce(sum(octet_length(payload::text)),0)>4194304 from public.content_documents where release_id=new.id)
   then raise check_violation using message='Incomplete release: four bounded documents required'; end if;
 elsif tg_table_name='content_documents' then
  -- Serialize document edits with publication of either the old or new parent.
  if tg_op<>'INSERT' then
   select r.state into state from public.content_releases r where r.id=old.release_id for update;
   if state='published' then raise check_violation using message='Published document is immutable'; end if;
  end if;
  if tg_op<>'DELETE' then
   select r.state into state from public.content_releases r where r.id=new.release_id for update;
   if state='published' then raise check_violation using message='Published document is immutable'; end if;
  end if;
 else
  select r.state into state from public.content_releases r where r.id=new.release_id for share;
  if state is distinct from 'published' then raise check_violation using message='Channel requires a published release'; end if;
 end if;
 if tg_op='DELETE' then return old; else return new; end if;
end $$;
create trigger guard_release before insert or update or delete on public.content_releases for each row execute function buildwisp_private.guard_content();
create trigger guard_document before insert or update or delete on public.content_documents for each row execute function buildwisp_private.guard_content();
create trigger guard_channel before insert or update on public.content_channels for each row execute function buildwisp_private.guard_content();
revoke all on all functions in schema buildwisp_private from public,anon,authenticated;
