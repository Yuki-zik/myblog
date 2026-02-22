-- article-level comments (separate from paragraph comments)

create table public.article_comments (
  id bigserial primary key,
  post_slug text not null,
  body_md text not null,
  status public.comment_status not null default 'visible',
  author_id uuid not null,
  author_name text not null,
  author_email text null,
  author_website text null,
  auth_provider text not null default 'anonymous',
  created_at timestamptz not null default now()
);

alter table public.article_comments
  add constraint article_comments_author_name_len
    check (char_length(author_name) >= 1 and char_length(author_name) <= 40),
  add constraint article_comments_body_len
    check (char_length(body_md) >= 1 and char_length(body_md) <= 5000),
  add constraint article_comments_auth_provider_len
    check (char_length(auth_provider) >= 1 and char_length(auth_provider) <= 32);

create index article_comments_post_status_created_idx
  on public.article_comments (post_slug, status, created_at);

create index article_comments_created_at_idx
  on public.article_comments (created_at);

grant select on public.article_comments to anon, authenticated;
grant insert on public.article_comments to authenticated;
grant usage, select on sequence public.article_comments_id_seq to authenticated;

alter table public.article_comments enable row level security;

create policy "read visible article comments"
on public.article_comments
for select
using (status = 'visible');

create policy "insert article comment (authenticated only)"
on public.article_comments
for insert
to authenticated
with check (auth.uid() = author_id);
