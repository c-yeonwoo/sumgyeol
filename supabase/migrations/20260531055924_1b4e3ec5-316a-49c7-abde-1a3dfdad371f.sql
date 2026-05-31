
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique,
  display_name text,
  avatar_url text,
  bio text,
  onboarded boolean default false,
  created_at timestamptz default now()
);

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "profiles are viewable by everyone"
  on public.profiles for select to anon, authenticated using (true);

create policy "users can insert their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- questions
create table public.questions (
  id bigint generated always as identity primary key,
  text text not null,
  category text,
  tone text,
  answer_style text,
  season text,
  source text default 'seed',
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

grant select on public.questions to anon, authenticated;
grant all on public.questions to service_role;

alter table public.questions enable row level security;

create policy "questions viewable by everyone"
  on public.questions for select to anon, authenticated using (is_active = true);

-- daily_questions
create table public.daily_questions (
  date date primary key,
  question_id bigint not null references public.questions(id)
);

grant select on public.daily_questions to anon, authenticated;
grant all on public.daily_questions to service_role;

alter table public.daily_questions enable row level security;

create policy "daily questions viewable by everyone"
  on public.daily_questions for select to anon, authenticated using (true);

-- answers
create table public.answers (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id bigint not null references public.questions(id),
  photo_url text not null,
  caption text,
  visibility text not null default 'public' check (visibility in ('public','private')),
  created_at timestamptz default now(),
  unique (user_id, question_id)
);

create index answers_question_public_idx on public.answers(question_id, created_at desc) where visibility = 'public';
create index answers_user_created_idx on public.answers(user_id, created_at desc);

grant select, insert, update, delete on public.answers to authenticated;
grant select on public.answers to anon;
grant all on public.answers to service_role;

alter table public.answers enable row level security;

create policy "users can view own answers"
  on public.answers for select to authenticated using (auth.uid() = user_id);

create policy "public answers viewable by everyone"
  on public.answers for select to anon, authenticated using (visibility = 'public');

create policy "users insert own answers"
  on public.answers for insert to authenticated with check (auth.uid() = user_id);

create policy "users update own answers"
  on public.answers for update to authenticated using (auth.uid() = user_id);

create policy "users delete own answers"
  on public.answers for delete to authenticated using (auth.uid() = user_id);

-- persona_reads
create table public.persona_reads (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  summary text not null,
  keywords text[] default '{}',
  based_on_count int not null default 0,
  generated_at timestamptz default now()
);

create index persona_reads_user_idx on public.persona_reads(user_id, generated_at desc);

grant select, insert on public.persona_reads to authenticated;
grant all on public.persona_reads to service_role;

alter table public.persona_reads enable row level security;

create policy "users can view own persona reads"
  on public.persona_reads for select to authenticated using (auth.uid() = user_id);

create policy "users can insert own persona reads"
  on public.persona_reads for insert to authenticated with check (auth.uid() = user_id);

-- trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, handle)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'user_' || substring(new.id::text, 1, 8)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- storage bucket for answer photos (public read)
insert into storage.buckets (id, name, public)
values ('answers', 'answers', true)
on conflict (id) do nothing;

create policy "answer photos publicly readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'answers');

create policy "users upload own answer photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'answers' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users update own answer photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'answers' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete own answer photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'answers' and (storage.foldername(name))[1] = auth.uid()::text);
