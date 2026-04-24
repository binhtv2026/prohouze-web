-- ProHouzing Core DB Init Script (Direct SQL)
-- Chạy: psql -p5432 -U prohouzing -d prohouzing_db -f init_db_direct.sql

-- ENUMS
DO $$ BEGIN
  CREATE TYPE org_type AS ENUM ('company', 'branch', 'department');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'inactive', 'locked', 'pending');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE deal_status AS ENUM ('open', 'won', 'lost', 'cancelled');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- TABLE: organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  legal_name VARCHAR(200),
  org_type VARCHAR(50) DEFAULT 'company',
  status VARCHAR(20) DEFAULT 'active',
  timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
  currency_code VARCHAR(10) DEFAULT 'VND',
  locale VARCHAR(20) DEFAULT 'vi-VN',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: organizational_units
CREATE TABLE IF NOT EXISTS organizational_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES organizational_units(id),
  code VARCHAR(50),
  name VARCHAR(200) NOT NULL,
  unit_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  employee_code VARCHAR(50),
  email VARCHAR(200) UNIQUE NOT NULL,
  phone VARCHAR(20),
  full_name VARCHAR(200) NOT NULL,
  hashed_password VARCHAR(500),
  role VARCHAR(50) DEFAULT 'sales',
  status VARCHAR(20) DEFAULT 'active',
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  code VARCHAR(50),
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(10),
  nationality VARCHAR(50) DEFAULT 'Vietnamese',
  address TEXT,
  id_number VARCHAR(50),
  id_type VARCHAR(20) DEFAULT 'CCCD',
  occupation VARCHAR(100),
  income_range VARCHAR(50),
  customer_type VARCHAR(50) DEFAULT 'individual',
  status VARCHAR(20) DEFAULT 'active',
  source VARCHAR(50),
  assigned_to UUID REFERENCES users(id),
  tags JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  code VARCHAR(50) UNIQUE,
  name VARCHAR(200) NOT NULL,
  project_type VARCHAR(50) DEFAULT 'apartment',
  status VARCHAR(50) DEFAULT 'selling',
  province VARCHAR(100),
  district VARCHAR(100),
  ward VARCHAR(100),
  address TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  total_units INTEGER DEFAULT 0,
  developer VARCHAR(200),
  handover_date DATE,
  legal_status VARCHAR(100),
  description TEXT,
  cover_image TEXT,
  amenities JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: products (units)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  unit_type VARCHAR(50) DEFAULT 'apartment',
  floor INTEGER,
  block VARCHAR(50),
  area DECIMAL(10,2),
  bedrooms INTEGER DEFAULT 2,
  bathrooms INTEGER DEFAULT 2,
  direction VARCHAR(20),
  status VARCHAR(50) DEFAULT 'available',
  base_price DECIMAL(20,2),
  price_per_m2 DECIMAL(20,2),
  current_price DECIMAL(20,2),
  floor_plan_url TEXT,
  images JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  assigned_to UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  source VARCHAR(100),
  status VARCHAR(50) DEFAULT 'new',
  budget_min DECIMAL(20,2),
  budget_max DECIMAL(20,2),
  interest_type VARCHAR(100),
  notes TEXT,
  next_follow_up_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: deals
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  customer_id UUID REFERENCES customers(id),
  product_id UUID REFERENCES products(id),
  assigned_to UUID REFERENCES users(id),
  deal_code VARCHAR(50),
  stage VARCHAR(50) DEFAULT 'negotiating',
  status VARCHAR(20) DEFAULT 'open',
  value DECIMAL(20,2),
  discount DECIMAL(20,2) DEFAULT 0,
  final_value DECIMAL(20,2),
  probability INTEGER DEFAULT 50,
  expected_close_date DATE,
  closed_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id),
  customer_id UUID REFERENCES customers(id),
  product_id UUID REFERENCES products(id),
  agent_id UUID REFERENCES users(id),
  booking_code VARCHAR(50) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  booking_fee DECIMAL(20,2) DEFAULT 0,
  booking_date DATE,
  expiry_date DATE,
  notes TEXT,
  documents JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  entity_type VARCHAR(50),
  entity_id UUID,
  action VARCHAR(100),
  summary TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: assignments
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type VARCHAR(50),
  entity_id UUID,
  user_id UUID REFERENCES users(id),
  role VARCHAR(50) DEFAULT 'owner',
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  unassigned_at TIMESTAMPTZ
);

-- TABLE: tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  entity_type VARCHAR(50),
  entity_id UUID,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  task_type VARCHAR(50) DEFAULT 'follow_up',
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  title VARCHAR(500),
  body TEXT,
  type VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  entity_type VARCHAR(50),
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default org
INSERT INTO organizations (id, code, name, legal_name, org_type, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'PROHOUZING',
  'ProHouzing Vietnam',
  'Công ty TNHH ProHouzing Việt Nam',
  'company',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Seed admin user (password: Admin@1234 -> hashed)
INSERT INTO users (id, org_id, email, full_name, hashed_password, role, status)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'admin@prohouzing.com',
  'Admin ProHouzing',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LPeG5tOt/zXGfvwJC',
  'admin',
  'active'
) ON CONFLICT (email) DO NOTHING;

\echo '✅ ProHouzing DB schema initialized successfully!'
