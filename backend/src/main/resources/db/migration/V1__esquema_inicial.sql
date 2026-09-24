create table usuarios (
    id            bigint generated always as identity primary key,
    nombre        varchar(100) not null,
    email         varchar(150) not null unique,
    password_hash varchar(100) not null,
    rol           varchar(20)  not null check (rol in ('USUARIO', 'TECNICO', 'ADMIN')),
    activo        boolean      not null default true,
    created_at    timestamptz  not null default now()
);

create table categorias (
    id          bigint generated always as identity primary key,
    nombre      varchar(80)  not null unique,
    descripcion varchar(255),
    activa      boolean      not null default true
);

create table tickets (
    id           bigint generated always as identity primary key,
    titulo       varchar(150) not null,
    descripcion  text         not null,
    estado       varchar(20)  not null check (estado in ('ABIERTO', 'EN_PROGRESO', 'EN_ESPERA', 'RESUELTO', 'CERRADO')),
    prioridad    varchar(20)  not null check (prioridad in ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')),
    categoria_id bigint       not null references categorias (id),
    creador_id   bigint       not null references usuarios (id),
    asignado_id  bigint       references usuarios (id),
    created_at   timestamptz  not null default now(),
    updated_at   timestamptz  not null default now(),
    resuelto_at  timestamptz,
    cerrado_at   timestamptz
);

create index idx_tickets_estado on tickets (estado);
create index idx_tickets_creador on tickets (creador_id);
create index idx_tickets_asignado on tickets (asignado_id);

create table comentarios (
    id         bigint generated always as identity primary key,
    ticket_id  bigint      not null references tickets (id) on delete cascade,
    autor_id   bigint      not null references usuarios (id),
    contenido  text        not null,
    interno    boolean     not null default false,
    created_at timestamptz not null default now()
);

create index idx_comentarios_ticket on comentarios (ticket_id);

create table historial_tickets (
    id             bigint generated always as identity primary key,
    ticket_id      bigint      not null references tickets (id) on delete cascade,
    usuario_id     bigint      not null references usuarios (id),
    accion         varchar(20) not null check (accion in ('CREADO', 'ESTADO', 'ASIGNACION', 'PRIORIDAD', 'EDICION')),
    valor_anterior varchar(255),
    valor_nuevo    varchar(255),
    created_at     timestamptz not null default now()
);

create index idx_historial_ticket on historial_tickets (ticket_id);

-- RLS activado y SIN politicas: la API publica de Supabase (PostgREST / anon key)
-- no puede leer ni escribir nada. Solo el backend (usuario postgres) accede.
-- La tabla flyway_schema_history se protege en afterMigrate.sql (aqui se bloquearia: Flyway la tiene tomada).
alter table usuarios enable row level security;
alter table categorias enable row level security;
alter table tickets enable row level security;
alter table comentarios enable row level security;
alter table historial_tickets enable row level security;
