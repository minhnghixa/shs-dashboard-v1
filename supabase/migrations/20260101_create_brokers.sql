-- Tạo bảng brokers
create table if not exists public.brokers (
  ma_mg               text        primary key,
  ho_ten              text        not null,
  team                text        not null,
  chi_nhanh           text        not null,

  -- Phí giao dịch
  fee_truoc           bigint      not null default 0,
  fee_nay             bigint      not null default 0,
  fee_tuyet_doi       bigint      not null default 0,
  fee_pct             numeric(10,2),

  -- Dư nợ Margin
  mar_margin_truoc    bigint      not null default 0,
  mar_3ben_truoc      bigint      not null default 0,
  mar_ungtruoc_truoc  bigint      not null default 0,
  mar_tong_truoc      bigint      not null default 0,
  mar_margin_nay      bigint      not null default 0,
  mar_3ben_nay        bigint      not null default 0,
  mar_ungtruoc_nay    bigint      not null default 0,
  mar_tong_nay        bigint      not null default 0,
  mar_tuyet_doi       bigint      not null default 0,
  mar_pct             numeric(10,2),

  -- Tài khoản Active
  active_truoc        integer     not null default 0,
  active_nay          integer     not null default 0,
  active_tuyet_doi    integer     not null default 0,
  active_pct          numeric(10,2),

  -- Metadata
  updated_at          timestamptz not null default now()
);

-- Index tìm kiếm theo chi nhánh và team
create index if not exists idx_brokers_chi_nhanh on public.brokers(chi_nhanh);
create index if not exists idx_brokers_team      on public.brokers(team);

-- Tự cập nhật updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_brokers_updated_at on public.brokers;
create trigger trg_brokers_updated_at
  before update on public.brokers
  for each row execute function public.set_updated_at();

-- Cho phép đọc không cần auth (public read)
alter table public.brokers enable row level security;

create policy "Allow public read" on public.brokers
  for select using (true);

create policy "Allow authenticated insert/update" on public.brokers
  for all using (true) with check (true);

comment on table  public.brokers                is 'Dữ liệu môi giới — import từ file broker_normalized.xlsx';
comment on column public.brokers.ma_mg          is 'Mã môi giới — primary key, luôn UPPERCASE';
comment on column public.brokers.fee_pct        is '% tăng trưởng phí. NULL khi fee_truoc = 0';
comment on column public.brokers.mar_pct        is '% tăng trưởng dư nợ. NULL khi mar_tong_truoc = 0';
comment on column public.brokers.active_pct     is '% tăng trưởng active. NULL khi active_truoc = 0 (123/150 rows)';
