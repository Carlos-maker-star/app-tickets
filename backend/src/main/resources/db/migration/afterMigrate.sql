-- Callback de Flyway: se ejecuta despues de cada migrate (idempotente).
-- Protege la tabla de historial de Flyway de la API publica de Supabase.
alter table flyway_schema_history enable row level security;
