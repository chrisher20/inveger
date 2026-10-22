-- ============================================
-- INVEGER - Módulo Visitas Médicas
-- Ejecutar en SQL Editor de Supabase
-- ============================================

-- Visitadores (representantes de laboratorios)
create table public.visitadores (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  contacto text,
  laboratorio text not null,
  activo boolean default true,
  created_at timestamptz default now()
);

-- Visitas registradas
create table public.visitas (
  id uuid default gen_random_uuid() primary key,
  visitador_id uuid references public.visitadores(id),
  visitador_nombre text not null,
  laboratorio text not null,
  fecha date not null,
  hora timestamptz default now(),
  tipo_visita text not null check (tipo_visita in (
    'programar_factura', 'visita_cortesia', 'oferta_productos',
    'entrega_presente', 'recordatorio_factura', 'entrega_bonos', 'otro'
  )),
  productos_ofrecidos text,
  novedades text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Deshabilitar RLS para simplicidad (igual que usuarios)
alter table public.visitadores disable row level security;
alter table public.visitas disable row level security;
