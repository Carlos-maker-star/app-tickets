# App Tickets

Sistema de **tickets de incidencia** (mesa de ayuda): los usuarios reportan problemas, los
técnicos los atienden y los administradores gestionan usuarios, categorías y asignaciones.

## Funcionalidades

- Registro e inicio de sesión con JWT.
- Tres roles: **Usuario** (reporta y sigue sus tickets), **Técnico** (atiende, escribe notas
  internas) y **Administrador** (asigna tickets y gestiona usuarios y categorías).
- Ciclo de vida del ticket: `Abierto → En progreso ⇄ En espera → Resuelto → Cerrado`, con
  reapertura y cancelación. Las reglas de cada transición se validan en el backend.
- Comentarios con notas internas visibles solo para el equipo, e historial de cambios.
- Dashboard por rol, listado con búsqueda, filtros y paginación.
- Modo claro y oscuro.

## Stack

| Parte | Tecnología |
|---|---|
| Backend | Java 21 · Spring Boot 4.1 · Spring Security (JWT) · Spring Data JPA · Flyway |
| Base de datos | PostgreSQL (Supabase) |
| Frontend | Angular 22 · Angular Material · Tailwind CSS 4 |
| Tests | JUnit 5 + PostgreSQL embebido (backend) · Vitest (frontend) |

## Estructura

```
app-tickets/
├── backend/    API REST (Spring Boot)
├── frontend/   Cliente web (Angular)
└── CLAUDE.md   Documentación técnica: arquitectura, endpoints, modelo de datos y convenciones
```

## Cómo ejecutarlo

Requisitos: Java 21, Node.js 22.22+ o 24 LTS y una base PostgreSQL (por ejemplo, un proyecto
gratuito de Supabase). No hace falta instalar Maven: el proyecto trae el Maven Wrapper.

### Backend

```bash
cd backend
cp .env.example .env      # completa la conexión a la BD, JWT_SECRET y el admin inicial
./mvnw spring-boot:run    # en Windows: .\mvnw.cmd spring-boot:run
```

La API queda en `http://localhost:8080`, con la documentación Swagger en
`http://localhost:8080/swagger-ui.html`. Al arrancar, Flyway crea las tablas y se crea el
administrador definido en `.env`.

### Frontend

```bash
cd frontend
npm install
npm start
```

Abre `http://localhost:4200` e inicia sesión con el administrador.

### Tests

```bash
cd backend && ./mvnw test
cd frontend && npx ng test --watch=false
```
