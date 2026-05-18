-- ============================================================
-- 远峯投资策略工作台 — 完整数据库建表脚本
-- 幂等：可反复执行，已有对象自动跳过，已有数据不重复插入
-- ============================================================

-- 1. 启用 UUID 扩展
create extension if not exists "uuid-ossp";

-- ============================================================
-- 2. user_profiles（用户扩展信息）
-- ============================================================
create table if not exists public.user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  nickname      text,
  role          text not null default 'student' check (role in ('admin', 'student')),
  created_at    timestamptz not null default now()
);

-- 新用户注册时自动创建 profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.user_profiles (id, nickname, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nickname', split_part(new.email, '@', 1)),
    'student'
  );
  return new;
end;
$$;

-- 注册触发器
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 3. tickers（标的库）
-- ============================================================
create table if not exists public.tickers (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  code          text not null,
  type          text not null check (type in ('stock_us', 'stock_hk', 'stock_a', 'option', 'crypto')),
  currency      text not null check (currency in ('USD', 'HKD', 'CNY')),
  created_at    timestamptz not null default now()
);

create index if not exists idx_tickers_user on public.tickers(user_id);

-- ============================================================
-- 4. transactions（交易流水 — 核心表）
-- ============================================================
create table if not exists public.transactions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  ticker_id       uuid references public.tickers(id) on delete set null,
  type            text not null check (type in ('buy', 'sell', 'dividend', 'option_income', 'deposit', 'withdraw')),
  quantity        numeric,
  price           numeric,
  amount_orig     numeric,
  amount_usd      numeric,
  currency        text not null check (currency in ('USD', 'HKD', 'CNY')),
  -- 期权详情（JSONB）
  --   新版（单腿期权）：
  --   option_type: sell_put | sell_call | buy_put | buy_call
  --   action: open | close（开仓/平仓）
  --   position_id: string（分组 ID，自动管理，用户不可见）
  --   quantity: 合约数量（始终为正）
  --   price: 每张合约权利金 USD（始终为正）
  --   strike_price: 行权价
  --   expiration_date: 到期日
  --   注意：已删除 close_amount / buy_cost / sell_income / net_amount
  option_detail   jsonb default null,
  -- 备注
  note            text default '',
  -- 交易日期（用户指定的日期，不是录入时间）
  trade_date      date not null default current_date,
  created_at      timestamptz not null default now()
);

create index if not exists idx_transactions_user on public.transactions(user_id);
create index if not exists idx_transactions_ticker on public.transactions(ticker_id);
create index if not exists idx_transactions_type on public.transactions(type);
create index if not exists idx_transactions_date on public.transactions(trade_date desc);

-- ============================================================
-- 5. nav_history（净值历史）
-- ============================================================
create table if not exists public.nav_history (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  date            date not null,
  total_assets    numeric not null default 0,
  cash_balance    numeric not null default 0,
  nav             numeric not null default 1.0000,
  shares          numeric not null default 0,
  created_at      timestamptz not null default now(),
  -- 每个用户每天只能有一条净值记录
  unique(user_id, date)
);

create index if not exists idx_nav_user_date on public.nav_history(user_id, date desc);

-- ============================================================
-- 6. Row Level Security 策略
-- ============================================================

-- user_profiles
alter table public.user_profiles enable row level security;

drop policy if exists "用户可以查看自己的资料" on public.user_profiles;
create policy "用户可以查看自己的资料"
  on public.user_profiles for select
  using (auth.uid() = id);

drop policy if exists "管理员可以查看所有资料" on public.user_profiles;
create policy "管理员可以查看所有资料"
  on public.user_profiles for select
  using (
    exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "用户可以更新自己的资料" on public.user_profiles;
create policy "用户可以更新自己的资料"
  on public.user_profiles for update
  using (auth.uid() = id);

-- tickers
alter table public.tickers enable row level security;

drop policy if exists "用户只能看到自己的标的" on public.tickers;
create policy "用户只能看到自己的标的"
  on public.tickers for select
  using (auth.uid() = user_id);

drop policy if exists "用户可以创建自己的标的" on public.tickers;
create policy "用户可以创建自己的标的"
  on public.tickers for insert
  with check (auth.uid() = user_id);

drop policy if exists "用户可以更新自己的标的" on public.tickers;
create policy "用户可以更新自己的标的"
  on public.tickers for update
  using (auth.uid() = user_id);

drop policy if exists "用户可以删除自己的标的" on public.tickers;
create policy "用户可以删除自己的标的"
  on public.tickers for delete
  using (auth.uid() = user_id);

-- transactions
alter table public.transactions enable row level security;

drop policy if exists "用户只能看到自己的交易" on public.transactions;
create policy "用户只能看到自己的交易"
  on public.transactions for select
  using (auth.uid() = user_id);

drop policy if exists "用户可以创建自己的交易" on public.transactions;
create policy "用户可以创建自己的交易"
  on public.transactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "用户可以更新自己的交易" on public.transactions;
create policy "用户可以更新自己的交易"
  on public.transactions for update
  using (auth.uid() = user_id);

drop policy if exists "用户可以删除自己的交易" on public.transactions;
create policy "用户可以删除自己的交易"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- nav_history
alter table public.nav_history enable row level security;

drop policy if exists "用户只能看到自己的净值" on public.nav_history;
create policy "用户只能看到自己的净值"
  on public.nav_history for select
  using (auth.uid() = user_id);

drop policy if exists "用户可以创建自己的净值" on public.nav_history;
create policy "用户可以创建自己的净值"
  on public.nav_history for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- 7. 汇率表（每日汇率）
-- ============================================================
create table if not exists public.exchange_rates (
  id            uuid primary key default uuid_generate_v4(),
  date          date not null,
  from_currency text not null check (from_currency in ('USD', 'HKD', 'CNY')),
  to_currency   text not null default 'USD' check (to_currency = 'USD'),
  rate          numeric not null,
  created_at    timestamptz not null default now(),
  unique(date, from_currency)
);

create index if not exists idx_exchange_rates_date on public.exchange_rates(date desc);

alter table public.exchange_rates enable row level security;

drop policy if exists "所有人可查看汇率" on public.exchange_rates;
create policy "所有人可查看汇率"
  on public.exchange_rates for select
  to authenticated
  using (true);

drop policy if exists "管理员可编辑汇率" on public.exchange_rates;
create policy "管理员可编辑汇率"
  on public.exchange_rates for insert
  with check (
    exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "管理员可更新汇率" on public.exchange_rates;
create policy "管理员可更新汇率"
  on public.exchange_rates for update
  using (
    exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

-- tickers 表增加现价字段
alter table public.tickers add column if not exists current_price numeric default null;
alter table public.tickers add column if not exists price_updated_at date default null;
alter table public.tickers add column if not exists style text default null
  check (style is null or style in ('offensive', 'balanced', 'defensive'));

-- ============================================================
-- 8. strategies（AI策略构建）
-- ============================================================
create table if not exists public.strategies (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null,
  status          text not null default '规划中' check (status in ('规划中', '执行中', '已暂停', '已完成')),
  intent          text not null check (intent in ('加仓', '持有做成本', '保护利润', '期权攒股')),
  iv_level        text check (iv_level in ('高波动', '低波动', '不确定')),
  holdings        jsonb not null default '[]',
  user_input      text,
  ai_response     jsonb,
  edited_playbook jsonb,
  risk_level      text check (risk_level in ('保守', '平衡', '激进')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_strategies_user on public.strategies(user_id);

alter table public.strategies enable row level security;

drop policy if exists "用户只能访问自己的策略" on public.strategies;
create policy "用户只能访问自己的策略"
  on public.strategies for select
  using (auth.uid() = user_id);

drop policy if exists "用户可以创建自己的策略" on public.strategies;
create policy "用户可以创建自己的策略"
  on public.strategies for insert
  with check (auth.uid() = user_id);

drop policy if exists "用户可以更新自己的策略" on public.strategies;
create policy "用户可以更新自己的策略"
  on public.strategies for update
  using (auth.uid() = user_id);

drop policy if exists "用户可以删除自己的策略" on public.strategies;
create policy "用户可以删除自己的策略"
  on public.strategies for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 9. about_milestones（个人主页 — 里程碑事件，公开可读）
-- ============================================================
create table if not exists public.about_milestones (
  id            uuid primary key default uuid_generate_v4(),
  year          text not null,
  title         text not null,
  description   text not null default '',
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.about_milestones enable row level security;

drop policy if exists "公开可查看里程碑" on public.about_milestones;
create policy "公开可查看里程碑"
  on public.about_milestones for select
  to anon, authenticated
  using (true);

drop policy if exists "管理员可编辑里程碑" on public.about_milestones;
create policy "管理员可编辑里程碑"
  on public.about_milestones for insert
  with check (
    exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "管理员可更新里程碑" on public.about_milestones;
create policy "管理员可更新里程碑"
  on public.about_milestones for update
  using (
    exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "管理员可删除里程碑" on public.about_milestones;
create policy "管理员可删除里程碑"
  on public.about_milestones for delete
  using (
    exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 10. about_cases（个人主页 — 投资案例，公开可读）
-- ============================================================
create table if not exists public.about_cases (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  context       text not null default '',
  decision      text not null default '',
  execution     text not null default '',
  result        text not null default '',
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.about_cases enable row level security;

drop policy if exists "公开可查看案例" on public.about_cases;
create policy "公开可查看案例"
  on public.about_cases for select
  to anon, authenticated
  using (true);

drop policy if exists "管理员可编辑案例" on public.about_cases;
create policy "管理员可编辑案例"
  on public.about_cases for insert
  with check (
    exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "管理员可更新案例" on public.about_cases;
create policy "管理员可更新案例"
  on public.about_cases for update
  using (
    exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "管理员可删除案例" on public.about_cases;
create policy "管理员可删除案例"
  on public.about_cases for delete
  using (
    exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

-- Seed data（仅在表为空时插入，幂等）
do $$
begin
  if not exists (select 1 from public.about_milestones limit 1) then
    insert into public.about_milestones (year, title, description, sort_order) values
      ('2015', '初入市场', '开始系统学习价值投资，从阅读格雷厄姆、巴菲特经典著作入手，建立基本面研究的基本框架。这一年虽然交易不多，但奠定了"买股票就是买公司"的核心理念。', 1),
      ('2018', '熊市考验', 'A股和港股双双大幅下跌。在市场恐慌时坚持分批买入优质标的，年底实现了正收益。这次经历验证了"别人恐惧我贪婪"的策略有效性，也深刻理解了仓位管理的重要性。', 2),
      ('2021', '体系成型', '在多年实战基础上，总结出"倒金字塔建仓 + 长期持有 + 期权增收"三位一体的远峯投资体系，并开始向学员传授这套方法论。', 3);
  end if;

  if not exists (select 1 from public.about_cases limit 1) then
    insert into public.about_cases (title, context, decision, execution, result, sort_order) values
      ('SPY长期攒股与期权增收', '2020年疫情暴跌后，SPY从340跌至220附近，市场极度恐慌。', '判断这是长期布局SPY的良机。计划分批买入，每次下跌5%加仓一次，同时卖出虚值看跌期权获取额外权利金。', '在220-260区间分4批建仓，每批占总仓位的25%。同时每月卖出1-2张到期日30-45天的虚值看跌期权，权利金年化约8-12%。', '持仓至今，成本约240，现价远超成本。期权累计权利金收入摊薄成本约15%，实现了"股价上涨赚差价，横盘赚权利金"的双重收益。', 1),
      ('港股高股息攒股策略', '2023年港股持续低迷，多只高息蓝筹股股息率超过8%，但市场情绪悲观。', '选定3只现金流稳定、派息历史超过10年的港股央企，采用每月定额买入的方式持续建仓。', '每月固定投入等额资金，不分价格高低。在股价承压时单位资金买入更多股数，实现自然摊薄成本。期间收到的股息全部再投入。', '持仓约2年，平均股息率7.5%，复利再投后持仓成本逐步下降。即使股价未明显上涨，仅股息回报已远超同期理财产品。', 2),
      ('倒金字塔建仓应对震荡市', '2024年某优质科技股因行业政策利空出现回调，从高点下跌约30%，进入震荡区间。', '分析判断公司基本面未恶改，利空影响有限。采用倒金字塔建仓：价格越低，买入越多。设定4个买入层级。', '第一层（跌30%）：买入10%目标仓位；第二层（跌35%）：买入20%；第三层（跌40%）：买入30%；第四层（跌45%）：买入40%。每层之间间隔至少2周。', '实际只触发到第三层，平均成本低于初始买入价约12%。股价企稳反弹后，仓位获利约18%。倒金字塔结构让底部筹码权重更大，有效放大了反弹收益。', 3);
  end if;
end $$;

-- ============================================================
-- 12. about_resources（个人主页 — 资源/资料库，公开可读）
-- ============================================================
create table if not exists public.about_resources (
  id            uuid primary key default uuid_generate_v4(),
  type          text not null check (type in ('pdf', 'link')),
  title         text not null,
  description   text default '',
  url           text not null,
  file_path     text,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.about_resources enable row level security;

drop policy if exists "公开可查看资源" on public.about_resources;
create policy "公开可查看资源"
  on public.about_resources for select
  to anon, authenticated
  using (true);

drop policy if exists "管理员可添加资源" on public.about_resources;
create policy "管理员可添加资源"
  on public.about_resources for insert
  with check (
    exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "管理员可更新资源" on public.about_resources;
create policy "管理员可更新资源"
  on public.about_resources for update
  using (
    exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "管理员可删除资源" on public.about_resources;
create policy "管理员可删除资源"
  on public.about_resources for delete
  using (
    exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 11. 授予权限（必须在所有建表语句之后）
-- ============================================================
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all routines in schema public to anon, authenticated;
