-- Buckets schema v2
-- Core tables
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  view_pref text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  profile_id uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists tier_definitions (
  id uuid primary key default gen_random_uuid(),
  tier_name text not null,
  color text,
  created_at timestamptz default now()
);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'season_status') then
    create type season_status as enum ('planned','active','completed','cancelled');
  end if;
end $$;

create table if not exists seasons (
  id uuid primary key default gen_random_uuid(),
  season_name text not null,
  status season_status not null default 'planned',
  start_date timestamptz default now(),
  end_date timestamptz,
  winner_team_id uuid,
  mvp_player_id uuid references players(id),
  created_at timestamptz default now()
);

create table if not exists season_tier_rules (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  tier_definition_id uuid not null references tier_definitions(id),
  points_per_make integer not null default 1,
  created_at timestamptz default now(),
  unique(season_id, tier_definition_id)
);

create table if not exists season_teams (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  team_name text not null,
  created_at timestamptz default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'seasons_winner_team_fkey') then
    alter table seasons
      add constraint seasons_winner_team_fkey
      foreign key (winner_team_id) references season_teams(id);
  end if;
end $$;

create table if not exists season_roster (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  player_id uuid not null references players(id),
  season_team_id uuid references season_teams(id),
  season_tier_rule_id uuid not null references season_tier_rules(id),
  created_at timestamptz default now(),
  unique(season_id, player_id)
);

create table if not exists shot_events (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  season_roster_id uuid not null references season_roster(id),
  season_tier_rule_id uuid not null references season_tier_rules(id),
  result text not null check (result in ('make','miss')),
  points integer not null default 0,
  note text,
  taken_at timestamptz not null default now(),
  is_voided boolean not null default false,
  void_reason text,
  created_at timestamptz default now()
);

-- Derivative views
create or replace view v_season_player_stats as
select
  sr.season_id,
  sr.player_id,
  p.display_name as player_name,
  sum(case when se.is_voided then 0 else se.points end) as points,
  count(*) filter (where not se.is_voided) as shots,
  count(*) filter (where not se.is_voided and se.result = 'make') as makes
from season_roster sr
join players p on p.id = sr.player_id
left join shot_events se on se.season_roster_id = sr.id and se.is_voided = false
group by sr.season_id, sr.player_id, p.display_name;

create or replace view v_season_team_standings as
select
  st.season_id,
  st.id as season_team_id,
  st.team_name,
  coalesce(sum(ps.points),0) as team_points
from season_teams st
left join season_roster sr on sr.season_team_id = st.id
left join v_season_player_stats ps on ps.season_id = st.season_id and ps.player_id = sr.player_id
group by st.season_id, st.id, st.team_name;

create or replace view v_player_all_time_stats as
select
  p.id as player_id,
  p.display_name as player_name,
  coalesce(sum(case when se.is_voided then 0 else se.points end),0) as points,
  count(se.*) filter (where not se.is_voided) as shots,
  count(se.*) filter (where not se.is_voided and se.result='make') as makes
from players p
left join season_roster sr on sr.player_id = p.id
left join shot_events se on se.season_roster_id = sr.id and se.is_voided = false
group by p.id, p.display_name;

create or replace view v_player_tier_stats_all_time as
select
  p.id as player_id,
  p.display_name as player_name,
  td.id as tier_definition_id,
  td.tier_name,
  coalesce(sum(case when se.is_voided then 0 else se.points end),0) as points,
  count(se.*) filter (where not se.is_voided) as shots,
  count(se.*) filter (where not se.is_voided and se.result='make') as makes
from players p
left join season_roster sr on sr.player_id = p.id
left join season_tier_rules str on str.id = sr.season_tier_rule_id
left join tier_definitions td on td.id = str.tier_definition_id
left join shot_events se on se.season_roster_id = sr.id and se.is_voided = false
where td.id is not null
group by p.id, p.display_name, td.id, td.tier_name;

-- Trigger to protect points computation
create or replace function set_shot_event_points()
returns trigger as $$
begin
  if new.result = 'make' then
    select points_per_make into new.points from season_tier_rules where id = new.season_tier_rule_id;
  else
    new.points := 0;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_shot_event_points on shot_events;
create trigger trg_set_shot_event_points
before insert or update of result, season_tier_rule_id
on shot_events
for each row execute function set_shot_event_points();
