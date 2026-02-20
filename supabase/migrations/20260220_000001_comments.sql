-- 1) enums
create type public.comment_status as enum ('visible', 'hidden', 'pending');
create type public.comment_tag as enum ('none', 'correction', 'question', 'addition', 'counterexample', 'agree');

-- 2) table
create table public.comments (
  id bigserial primary key,
  post_slug text not null,
  anchor_id text not null,
  body text not null,
  tag public.comment_tag not null default 'none',
  status public.comment_status not null default 'visible',
  author_id uuid not null,
  created_at timestamptz not null default now()
);

-- 3) constraints and indexes
alter table public.comments
  add constraint comments_body_len check (char_length(body) >= 1 and char_length(body) <= 200);

create index comments_post_slug_idx on public.comments (post_slug);
create index comments_post_anchor_idx on public.comments (post_slug, anchor_id);
create index comments_created_at_idx on public.comments (created_at);

-- 4) grants
grant usage on schema public to anon, authenticated;
grant select on public.comments to anon, authenticated;
grant insert on public.comments to authenticated;
grant usage, select on sequence public.comments_id_seq to authenticated;

-- 5) rls
alter table public.comments enable row level security;

create policy "read visible comments"
on public.comments
for select
using (status = 'visible');

create policy "insert comment (authenticated only)"
on public.comments
for insert
to authenticated
with check (auth.uid() = author_id);
