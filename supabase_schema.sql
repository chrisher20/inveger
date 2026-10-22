-- ============================================
-- INVEGER - Schema Supabase
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- Tabla de usuarios (extiende auth.users)
create table public.usuarios (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text not null check (role in ('admin', 'consultor')),
  nombre text not null,
  fecha_nacimiento date,
  identidad text,
  fecha_ingreso date not null,
  salario numeric(12,2) not null default 0,
  tipo_usuario text not null,
  subtipo_tecnico text,
  created_at timestamptz default now()
);

-- Tabla de medicamentos
create table public.medicamentos (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  laboratorio text not null,
  cantidad_actual integer not null default 0,
  fecha_vencimiento date not null,
  ubicacion text not null,
  fecha_creacion timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- Tabla de solicitudes de vacaciones
create table public.solicitudes_vacaciones (
  id uuid default gen_random_uuid() primary key,
  empleado_id uuid references public.usuarios(id) on delete cascade,
  empleado_nombre text not null,
  dias_solicitados integer not null,
  fecha_inicio date not null,
  fecha_fin date not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','aprobada','rechazada','en_negociacion')),
  comentario_admin text,
  fecha_solicitud timestamptz default now()
);

-- Historial de vacaciones (acumulaciones y descuentos)
create table public.historial_vacaciones (
  id uuid default gen_random_uuid() primary key,
  empleado_id uuid references public.usuarios(id) on delete cascade,
  tipo text not null check (tipo in ('acumulacion', 'descuento')),
  dias integer not null,
  descripcion text,
  fecha timestamptz default now(),
  saldo_resultante integer not null
);

-- Horas extra
create table public.horas_extra (
  id uuid default gen_random_uuid() primary key,
  empleado_id uuid references public.usuarios(id) on delete cascade,
  fecha date not null,
  horas_diurnas numeric(5,2) default 0,
  horas_nocturnas numeric(5,2) default 0,
  horas_feriado numeric(5,2) default 0,
  salario_hora numeric(12,4),
  total_pagar numeric(12,2),
  created_at timestamptz default now()
);

-- Notificaciones
create table public.notificaciones (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references public.usuarios(id) on delete cascade,
  mensaje text not null,
  leida boolean default false,
  fecha timestamptz default now()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table public.usuarios enable row level security;
alter table public.medicamentos enable row level security;
alter table public.solicitudes_vacaciones enable row level security;
alter table public.historial_vacaciones enable row level security;
alter table public.horas_extra enable row level security;
alter table public.notificaciones enable row level security;

-- Usuarios: cualquier autenticado puede leer (necesario para cargar perfil al login)
create policy "usuarios_select" on public.usuarios for select
  using (true);

create policy "usuarios_insert_admin" on public.usuarios for insert
  with check (exists (
    select 1 from public.usuarios u where u.id = auth.uid() and u.role = 'admin'
  ));

-- Medicamentos: todos los autenticados pueden ver; solo admin puede modificar
create policy "medicamentos_select" on public.medicamentos for select
  using (auth.role() = 'authenticated');

create policy "medicamentos_insert_admin" on public.medicamentos for insert
  with check (exists (
    select 1 from public.usuarios u where u.id = auth.uid() and u.role = 'admin'
  ));

create policy "medicamentos_update_admin" on public.medicamentos for update
  using (exists (
    select 1 from public.usuarios u where u.id = auth.uid() and u.role = 'admin'
  ));

-- Vacaciones: empleado ve las suyas; admin ve todas
create policy "solicitudes_select" on public.solicitudes_vacaciones for select
  using (empleado_id = auth.uid() or exists (
    select 1 from public.usuarios u where u.id = auth.uid() and u.role = 'admin'
  ));

create policy "solicitudes_insert" on public.solicitudes_vacaciones for insert
  with check (empleado_id = auth.uid());

create policy "solicitudes_update_admin" on public.solicitudes_vacaciones for update
  using (exists (
    select 1 from public.usuarios u where u.id = auth.uid() and u.role = 'admin'
  ));

-- Historial vacaciones
create policy "historial_select" on public.historial_vacaciones for select
  using (empleado_id = auth.uid() or exists (
    select 1 from public.usuarios u where u.id = auth.uid() and u.role = 'admin'
  ));

create policy "historial_insert_admin" on public.historial_vacaciones for insert
  with check (exists (
    select 1 from public.usuarios u where u.id = auth.uid() and u.role = 'admin'
  ));

-- Horas extra
create policy "horas_select" on public.horas_extra for select
  using (empleado_id = auth.uid() or exists (
    select 1 from public.usuarios u where u.id = auth.uid() and u.role = 'admin'
  ));

create policy "horas_insert" on public.horas_extra for insert
  with check (empleado_id = auth.uid());

-- Notificaciones
create policy "notif_select" on public.notificaciones for select
  using (usuario_id = auth.uid());

create policy "notif_insert_admin" on public.notificaciones for insert
  with check (exists (
    select 1 from public.usuarios u where u.id = auth.uid() and u.role = 'admin'
  ));
