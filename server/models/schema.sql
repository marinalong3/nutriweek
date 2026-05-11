-- =============================================
-- NUTRIWEEK - Schema completo do banco de dados
-- Execute no Supabase SQL Editor
-- =============================================

-- EXTENSÕES
create extension if not exists "uuid-ossp";

-- =============================================
-- PROFILES (dados do usuário além do auth)
-- =============================================
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null,
  phone text,
  avatar_url text,
  plan text default 'trial' check (plan in ('trial', 'pro', 'family')),
  plan_status text default 'active' check (plan_status in ('active', 'canceled', 'past_due', 'trialing')),
  trial_used boolean default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  mp_subscription_id text,
  referral_code text unique default upper(substring(gen_random_uuid()::text, 1, 8)),
  referred_by uuid references profiles(id),
  pending_discount numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- FAMILY_PROFILES (perfis adicionais - plano família)
-- =============================================
create table family_profiles (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references profiles(id) on delete cascade,
  name text not null,
  preferences jsonb default '{}',
  created_at timestamptz default now()
);

-- =============================================
-- USER_PREFERENCES (questionário de onboarding)
-- =============================================
create table user_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  profile_id uuid references family_profiles(id) on delete cascade, -- null = perfil principal
  
  -- Refeições habilitadas
  meals_enabled jsonb default '["breakfast","morning_snack","lunch","afternoon_snack","dinner","supper"]',
  
  -- Número de pessoas
  people_count int default 1,
  
  -- Tipos de culinária preferidos
  cuisine_types text[] default '{}',
  -- opções: caseira, italiana, japonesa, mexicana, árabe, nordestina, vegetariana, 
  -- vegana, low-carb, low-fodmap, fitness, alto_proteina, sanduiches, saladas, sopas
  
  -- Alimentos que não gosta
  disliked_foods text[] default '{}',
  
  -- Restrições alimentares / alergias
  restrictions text[] default '{}',
  -- opções: gluten, lactose, amendoim, frutos_mar, ovo, soja, nozes
  
  -- Temperos favoritos
  favorite_spices text[] default '{}',
  
  -- Equipamentos disponíveis
  appliances text[] default '{}',
  -- opções: fogao, forno, microondas, airfryer, liquidificador, processador, panela_pressao, churrasqueira
  
  -- Evita fritura?
  avoid_frying boolean default false,
  
  -- Meta
  goal text default 'variety',
  -- opções: variety, weight_loss, muscle_gain, health, budget
  
  -- Orçamento semanal estimado (R$)
  weekly_budget numeric,
  
  -- Tempo médio disponível para cozinhar (minutos)
  cooking_time_minutes int default 45,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- WEEKLY_MENUS (cardápios gerados)
-- =============================================
create table weekly_menus (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  profile_id uuid references family_profiles(id), -- null = perfil principal
  week_start date not null,
  week_end date not null,
  status text default 'draft' check (status in ('draft', 'active', 'completed', 'archived')),
  meals jsonb not null default '{}',
  -- estrutura: { "monday": { "breakfast": {...}, "lunch": {...}, ... }, ... }
  ingredients_at_home jsonb default '[]',
  -- ingredientes que o usuário já tinha em casa
  shopping_list_generated boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- MEALS (refeições individuais dentro do cardápio)
-- =============================================
create table meal_ratings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  menu_id uuid references weekly_menus(id) on delete cascade,
  meal_key text not null, -- ex: "monday_lunch"
  meal_name text not null,
  status text check (status in ('made', 'not_made', 'skipped')),
  rating int check (rating between 1 and 5),
  liked boolean,
  dislike_reasons text[] default '{}',
  -- opções: muito_temperado, pouco_temperado, nao_gostei_textura, muito_demorado,
  -- ingredientes_dificeis, muito_calorico, nao_combinou, prefiro_outro_tipo
  is_favorite boolean default false,
  created_at timestamptz default now()
);

-- =============================================
-- MEAL_ALTERNATIVES (3 alternativas quando não gostou)
-- =============================================
create table meal_alternatives (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  rating_id uuid references meal_ratings(id) on delete cascade,
  alternatives jsonb not null, -- array de 3 opções geradas pela IA
  chosen_index int, -- qual das 3 o usuário escolheu (0, 1 ou 2)
  created_at timestamptz default now()
);

-- =============================================
-- FAVORITE_RECIPES (receitas favoritas)
-- =============================================
create table favorite_recipes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  recipe_name text not null,
  recipe_data jsonb not null,
  frequency_boost int default 1, -- quanto mais alto, mais frequente no cardápio
  created_at timestamptz default now()
);

-- =============================================
-- DISLIKED_RECIPES (receitas que não gostou - nunca repetir)
-- =============================================
create table disliked_recipes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  recipe_name text not null,
  reasons text[] default '{}',
  created_at timestamptz default now()
);

-- =============================================
-- SHOPPING_LISTS (listas de compras)
-- =============================================
create table shopping_lists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  menu_id uuid references weekly_menus(id) on delete cascade,
  items jsonb not null default '[]',
  -- estrutura: [{ category, name, quantity, unit, checked, already_have }]
  -- categorias: hortifruti, carnes_aves_peixes, laticinios_frios, 
  --             padaria, mercearia, congelados, higiene_limpeza, outros
  is_complete boolean default false,
  plan_type text, -- 'basic' ou 'complete'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- NUTRITION_DATA (dados nutricionais por receita)
-- =============================================
create table nutrition_data (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  menu_id uuid references weekly_menus(id) on delete cascade,
  meal_key text not null,
  recipe_name text not null,
  ingredients_data jsonb default '[]',
  -- cada item: { name, photo_url, nutrition_per_100g, quantity_in_recipe, unit, source }
  -- source: 'user_upload' | 'generic_internet'
  nutrition_table jsonb,
  -- tabela nutricional calculada por porção e por 100g
  -- segue legislação ANVISA (RDC 429/2020)
  is_approximate boolean default false, -- true se usou dados genéricos
  serving_size_g numeric,
  created_at timestamptz default now()
);

-- =============================================
-- COUPONS (cupons de desconto)
-- =============================================
create table coupons (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  discount_type text check (discount_type in ('percent', 'fixed')),
  discount_value numeric not null,
  max_uses int,
  uses_count int default 0,
  valid_until timestamptz,
  applies_to text default 'all' check (applies_to in ('all', 'pro', 'family')),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- =============================================
-- COUPON_USES (histórico de uso de cupons)
-- =============================================
create table coupon_uses (
  id uuid default uuid_generate_v4() primary key,
  coupon_id uuid references coupons(id),
  user_id uuid references profiles(id),
  used_at timestamptz default now()
);

-- =============================================
-- REFERRALS (programa de indicação)
-- =============================================
create table referrals (
  id uuid default uuid_generate_v4() primary key,
  referrer_id uuid references profiles(id),
  referred_id uuid references profiles(id),
  status text default 'pending' check (status in ('pending', 'converted', 'rewarded')),
  reward_applied boolean default false,
  converted_at timestamptz,
  created_at timestamptz default now()
);

-- =============================================
-- CANCELLATION_REQUESTS (solicitações de cancelamento)
-- =============================================
create table cancellation_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id),
  reason text,
  refund_eligible boolean default false,
  refund_status text default 'none' check (refund_status in ('none', 'pending', 'processed', 'denied')),
  subscription_start timestamptz,
  requested_at timestamptz default now(),
  processed_at timestamptz
);

-- =============================================
-- INDEXES
-- =============================================
create index idx_profiles_referral_code on profiles(referral_code);
create index idx_weekly_menus_user_id on weekly_menus(user_id);
create index idx_weekly_menus_week_start on weekly_menus(week_start);
create index idx_meal_ratings_user_id on meal_ratings(user_id);
create index idx_shopping_lists_menu_id on shopping_lists(menu_id);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
alter table profiles enable row level security;
alter table user_preferences enable row level security;
alter table weekly_menus enable row level security;
alter table meal_ratings enable row level security;
alter table shopping_lists enable row level security;
alter table nutrition_data enable row level security;
alter table favorite_recipes enable row level security;
alter table disliked_recipes enable row level security;
alter table family_profiles enable row level security;

-- Políticas: usuário só vê os próprios dados
create policy "Users see own profile" on profiles for all using (auth.uid() = id);
create policy "Users see own preferences" on user_preferences for all using (auth.uid() = user_id);
create policy "Users see own menus" on weekly_menus for all using (auth.uid() = user_id);
create policy "Users see own ratings" on meal_ratings for all using (auth.uid() = user_id);
create policy "Users see own shopping lists" on shopping_lists for all using (auth.uid() = user_id);
create policy "Users see own nutrition" on nutrition_data for all using (auth.uid() = user_id);
create policy "Users see own favorites" on favorite_recipes for all using (auth.uid() = user_id);
create policy "Users see own dislikes" on disliked_recipes for all using (auth.uid() = user_id);
create policy "Users see own family profiles" on family_profiles for all using (auth.uid() = owner_id);

-- =============================================
-- FUNÇÃO: atualizar updated_at automaticamente
-- =============================================
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles for each row execute function update_updated_at();
create trigger preferences_updated_at before update on user_preferences for each row execute function update_updated_at();
create trigger menus_updated_at before update on weekly_menus for each row execute function update_updated_at();
create trigger shopping_updated_at before update on shopping_lists for each row execute function update_updated_at();

-- =============================================
-- CUPONS INICIAIS DE EXEMPLO
-- =============================================
insert into coupons (code, discount_type, discount_value, max_uses, applies_to) values
  ('LANCAMENTO30', 'percent', 30, 100, 'all'),
  ('BEMVINDO', 'percent', 20, 500, 'all'),
  ('PRO50', 'percent', 50, 50, 'pro'),
  ('FAMILIA10', 'fixed', 10, 200, 'family');
