# CLAUDE.md

Guía para Claude Code (y para cualquier desarrollador) sobre este repositorio.

## Qué es

**app-tickets**: un sistema sencillo de tickets de incidencia. Los usuarios reportan problemas, los técnicos los atienden y los administradores gestionan usuarios, categorías y asignaciones.

## Estructura del repositorio

```
app-tickets/
├── backend/            API REST en Spring Boot (Java 21, Maven)
├── frontend/           Cliente Angular 22 + Angular Material + Tailwind
├── .claude/launch.json Servidores para el panel de preview (backend :8080, frontend :4200)
├── render.yaml         Blueprint de Render (backend en Docker, plan Free)
├── .mcp.json           MCP de Supabase para Claude Code (NO lo usa el backend)
└── CLAUDE.md
```

> **Importante:** el MCP de Supabase (`.mcp.json`) sirve para que **Claude Code** inspeccione la base de datos (tablas, logs, docs) durante el desarrollo. Ya **no** está en `read_only`, pero se usa solo para consultar. El **backend** se conecta a Supabase por su cuenta, como a cualquier PostgreSQL, vía JDBC. Los cambios de esquema se hacen **siempre con migraciones Flyway** del backend, nunca a mano ni por el MCP (si no, `ddl-auto=validate` falla al arrancar).

## Stack del backend

- Java 21 · Spring Boot 4.1 (Spring Framework 7, Spring Security 7, Hibernate 7, **Jackson 3**)
- Maven Wrapper (`mvnw`): **no hace falta instalar Maven**; el wrapper descarga la versión correcta la primera vez
- Spring Web MVC, Spring Data JPA, Bean Validation, Spring Security
- PostgreSQL (Supabase) + Flyway
- JWT propio (jjwt 0.13) con contraseñas en BCrypt
- springdoc-openapi 3 (Swagger UI en `http://localhost:8080/swagger-ui.html`)
- Lombok para entidades; DTOs como `record`
- Tests: JUnit 5, MockMvc y PostgreSQL 17 embebido (zonky), sin Docker

## Comandos (desde `backend/`)

```bash
./mvnw spring-boot:run                    # levantar la API en http://localhost:8080 (requiere backend/.env)
./mvnw test                               # todos los tests (unitarios + integración con PG embebido)
./mvnw -Dtest=TransicionEstadoTest test   # un solo test
./mvnw clean package                      # generar el jar
```

En PowerShell usar `.\mvnw.cmd` en lugar de `./mvnw`.

## Configuración y secretos

Nunca se commitean credenciales. `application.yml` lee variables de entorno y, si existe, el archivo `backend/.env` (plantilla en `backend/.env.example`; `.env` está en `.gitignore`).

| Variable | Ejemplo / Nota |
|---|---|
| `DB_URL` | `jdbc:postgresql://aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require` (Session pooler: la conexión directa `db.<ref>.supabase.co` es solo IPv6) |
| `DB_USER` | `postgres.dmhrmuzixvqlrygfgxet` |
| `DB_PASSWORD` | contraseña de la BD de Supabase |
| `JWT_SECRET` | Base64 de ≥ 32 bytes: `openssl rand -base64 48` |
| `JWT_EXPIRATION_MINUTES` | `120` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4200` (Angular dev server; separar con comas si hay varios) |
| `ADMIN_NOMBRE` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | admin inicial; `AdminInicialRunner` lo crea al arrancar solo si no existe ningún ADMIN |

- `spring.jpa.hibernate.ddl-auto=validate`: Hibernate **nunca** modifica el esquema; lo hace Flyway.
- `spring.jpa.open-in-view=false`: todo acceso a relaciones LAZY y el mapeo a DTO ocurre dentro del `@Transactional` del servicio.

## Arquitectura del backend

Paquete raíz `com.carlos.tickets`, organizado **por funcionalidad**:

```
com.carlos.tickets
├── auth/          AuthController, AuthService, dto/
├── usuario/       Usuario, Rol, UsuarioRepository, UsuarioService, UsuarioController, AdminInicialRunner, dto/
├── categoria/     Categoria, CategoriaRepository, CategoriaService, CategoriaController, dto/
├── ticket/        Ticket, EstadoTicket, Prioridad, TicketRepository, TicketService, TicketController,
│                  TicketSpecifications (filtros), TicketAcceso (permisos), TransicionEstado (máquina de estados), dto/
├── comentario/    Comentario, ComentarioRepository, ComentarioService, ComentarioController, dto/
├── historial/     HistorialTicket, AccionHistorial, HistorialRepository, HistorialService, HistorialController, dto/
├── dashboard/     DashboardController, DashboardService, dto/
└── common/
    ├── config/    SecurityConfig, OpenApiConfig, AppProperties (prefijo app.*)
    ├── exception/ GlobalExceptionHandler, RecursoNoEncontradoException (404), ReglaNegocioException (409)
    ├── security/  JwtService, JwtAuthFilter, UsuarioAutenticado (principal), UsuarioDetailsService
    └── dto/       PaginaResponse
```

Reglas:
- **Controller** → solo HTTP: `@Valid`, `@PreAuthorize` por rol, delega al servicio. El usuario actual se recibe con `@AuthenticationPrincipal UsuarioAutenticado`.
- **Service** → lógica de negocio, permisos a nivel de ticket y `@Transactional`. Todo cambio de ticket registra historial con `HistorialService.registrar(...)`.
- Permisos sobre un ticket concreto: siempre cargar con `TicketAcceso.obtenerVisible(id, usuario)` (404/403) y usar `TicketAcceso.puedeEditar/esCreador/esAsignado`.
- Cambios de estado: **solo** a través de `TransicionEstado.validar(...)` + `Ticket.cambiarEstado(...)` (mantiene `resueltoAt`/`cerradoAt`).
- **Nunca** exponer entidades JPA: DTOs `record` (`XxxRequest` / `XxxResponse` / `XxxResumen`) con `static from(...)`.
- **Jackson 3**: en los `Request` usar `Boolean`/`Integer` (no primitivos) para campos opcionales; un primitivo ausente en el JSON da 400.
- Errores como `ProblemDetail` (RFC 7807) desde `GlobalExceptionHandler`: 400 validación (con `errores: {campo: mensaje}`), 401 no autenticado, 403 sin permiso, 404 no encontrado, 409 regla de negocio. Los 401/403 del filtro de seguridad también pasan por ahí.
- Relaciones `@ManyToOne(fetch = LAZY)`; los repositorios usan `@EntityGraph` para evitar N+1.
- Nombres de dominio en español; sufijos técnicos en inglés.

## Modelo de dominio

**Roles** (`Rol`): `USUARIO` (reporta), `TECNICO` (atiende), `ADMIN` (gestiona todo). El registro público siempre crea `USUARIO`; el ADMIN cambia roles.

| Entidad | Campos principales |
|---|---|
| `Usuario` | id, nombre, email (único, en minúsculas), passwordHash, rol, activo, createdAt |
| `Categoria` | id, nombre (único), descripcion, activa (borrado lógico) |
| `Ticket` | id, titulo, descripcion, estado, prioridad, categoria, creador, asignado (nullable), createdAt, updatedAt, resueltoAt, cerradoAt. `codigo` (`TCK-000042`) se deriva del id, no se guarda |
| `Comentario` | id, ticket, autor, contenido, interno (solo visible para TECNICO/ADMIN), createdAt |
| `HistorialTicket` | id, ticket, usuario, accion (`CREADO`, `ESTADO`, `ASIGNACION`, `PRIORIDAD`, `EDICION`), valorAnterior, valorNuevo, createdAt |

**Prioridad**: `BAJA`, `MEDIA` (por defecto), `ALTA`, `CRITICA`.

**Estados y transiciones** (`TransicionEstado`; transición inexistente → 409, actor no permitido → 403):

```
ABIERTO ──► EN_PROGRESO ──► RESUELTO ──► CERRADO
   │           │   ▲            │
   │           ▼   │            └──► ABIERTO   (el creador reabre)
   │        EN_ESPERA
   └──► CERRADO   (el creador o ADMIN lo cancela)
```

| Transición | Quién |
|---|---|
| ABIERTO → EN_PROGRESO | técnico asignado / ADMIN (requiere técnico asignado) |
| EN_PROGRESO ↔ EN_ESPERA | técnico asignado / ADMIN |
| EN_ESPERA → EN_PROGRESO | **automático** cuando el creador publica un comentario |
| EN_PROGRESO → RESUELTO | técnico asignado / ADMIN (fija `resueltoAt`) |
| RESUELTO → CERRADO | creador / ADMIN (fija `cerradoAt`) |
| RESUELTO → ABIERTO | creador (reapertura; limpia `resueltoAt`) |
| ABIERTO → CERRADO | creador / ADMIN (cancelación) |

Un ticket `CERRADO` es de solo lectura (no admite edición ni comentarios).

## Permisos por rol

- **USUARIO**: crea tickets; ve y comenta **solo los suyos** (sin comentarios internos); edita título/descripción/categoría/prioridad mientras esté `ABIERTO`; cierra, reabre o cancela los suyos según la tabla.
- **TECNICO**: ve todos los tickets; se autoasigna tickets sin asignar; edita y cambia el estado de los que tiene asignados; puede escribir comentarios internos.
- **ADMIN**: todo lo anterior + asignar/reasignar a cualquier técnico activo, gestionar usuarios/roles y categorías. No puede cambiar su propio rol ni desactivarse.

## Endpoints (`/api/v1`)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/auth/register` | público | `{nombre, email, password}` → 201 `{token, tipo, expiraEnSegundos, usuario}` |
| POST | `/auth/login` | público | `{email, password}` → `{token, tipo, expiraEnSegundos, usuario}` |
| GET | `/auth/me` | autenticado | Usuario actual |
| GET | `/tickets` | autenticado | Paginado. Filtros: `estado`, `prioridad`, `categoriaId`, `asignadoId`, `sinAsignar`, `q` (texto o código). Paginación: `page`, `size`, `sort` (por defecto `createdAt,desc`). USUARIO solo ve los suyos |
| POST | `/tickets` | autenticado | `{titulo, descripcion, categoriaId, prioridad?}` → 201 |
| GET | `/tickets/{id}` | con acceso | Detalle |
| PUT | `/tickets/{id}` | creador (ABIERTO) / técnico asignado / ADMIN | `{titulo, descripcion, categoriaId, prioridad}` |
| PATCH | `/tickets/{id}/estado` | según transición | `{estado, comentario?}` |
| PATCH | `/tickets/{id}/asignacion` | TECNICO (a sí mismo) / ADMIN | `{tecnicoId}` |
| GET | `/tickets/{id}/comentarios` | con acceso | USUARIO no recibe los internos |
| POST | `/tickets/{id}/comentarios` | con acceso | `{contenido, interno?}` → 201 |
| GET | `/tickets/{id}/historial` | con acceso | Línea de tiempo de cambios |
| GET | `/categorias` | autenticado | Activas; ADMIN puede pasar `?todas=true` |
| POST / PUT / DELETE | `/categorias[/{id}]` | ADMIN | CRUD (DELETE = desactivar, 204) |
| GET | `/usuarios` | ADMIN | Paginado |
| GET | `/usuarios/{id}` | ADMIN | Detalle |
| GET | `/usuarios/tecnicos` | TECNICO / ADMIN | Técnicos activos, para el selector de asignación |
| PATCH | `/usuarios/{id}/rol` | ADMIN | `{rol}` |
| PATCH | `/usuarios/{id}/estado` | ADMIN | `{activo}` |
| GET | `/dashboard/resumen` | autenticado | `{total, porEstado, porPrioridad, sinAsignar, asignadosAMi}` acotado al rol |

Contratos útiles para el frontend:
- Header `Authorization: Bearer <token>` en todo lo que no es público.
- `TicketResponse` incluye `transicionesPermitidas` (estados a los que **este** usuario puede mover el ticket) y `editable`. El frontend debe usarlos para mostrar u ocultar botones, sin duplicar reglas.
- Los listados paginados devuelven `PaginaResponse`: `{contenido, pagina, tamanio, totalElementos, totalPaginas}`.
- Fechas en ISO-8601 UTC (`Instant`).

## Base de datos (Supabase / PostgreSQL 17)

- Migraciones en `backend/src/main/resources/db/migration`, formato `V{n}__descripcion.sql`. **Nunca** editar una migración ya aplicada: crear una nueva.
- `afterMigrate.sql` es un callback de Flyway (se ejecuta tras cada migrate y debe ser idempotente).
- **No** tocar `flyway_schema_history` desde una migración `V__`: Flyway la tiene bloqueada durante el migrate y la migración se queda colgada.
- Tablas en `snake_case` y plural: `usuarios`, `categorias`, `tickets`, `comentarios`, `historial_tickets`.
- IDs `bigint generated always as identity`; fechas `timestamptz`; enums como `varchar` + `CHECK` (`@Enumerated(EnumType.STRING)`); textos largos `text` (`columnDefinition = "text"`).
- **Seguridad Supabase:** todas las tablas tienen `ENABLE ROW LEVEL SECURITY` y **ninguna política**. Así la API pública de Supabase (PostgREST con la anon key) no expone nada, y solo el backend (usuario `postgres`) accede. Toda tabla nueva debe hacer lo mismo.
- Categorías base en `V2__categorias_iniciales.sql`; el admin inicial viene de variables de entorno, no de SQL.

## Tests

- `TransicionEstadoTest`: unitario, cubre la máquina de estados.
- `TicketFlujoIntegrationTest`: `@SpringBootTest` + MockMvc contra un PostgreSQL 17 embebido. Aplica las migraciones reales, valida el mapeo JPA y recorre el ciclo de vida completo de un ticket, además de los casos 401/400/403.
- Los tests **nunca** apuntan a Supabase.
- La primera ejecución descarga los binarios de PostgreSQL embebido; el test de integración tarda unos 30 s.

---

# Frontend (`frontend/`)

## Stack

- Angular 22 (standalone, **zoneless**, signals, control flow `@if/@for`), TypeScript 6, Node ≥ 22.22.3 / 24 LTS
- **Angular Material 22** (MIT) para componentes interactivos: diálogos, selects, paginador, snackbar, menús, toggles
- **Tailwind CSS 4** para layout y estilos (vía `@tailwindcss/postcss`, config en `.postcssrc.json`)
- Fuentes Geist / Geist Mono e íconos Material Symbols Rounded (Google Fonts, en `index.html`)
- Tests: Vitest (`ng test`) con jsdom y `HttpTestingController`
- **No usar PrimeNG**: desde la v21/22 exige clave de licencia (PrimeUI); se descartó a propósito.

## Comandos (desde `frontend/`)

```bash
npm start                     # ng serve en http://localhost:4200 (requiere el backend en :8080)
npx ng build                  # build de producción en dist/
npx ng test --watch=false     # tests unitarios
```

La URL de la API está en `src/environments/environment.ts`.

## Estructura

```
src/
├── tailwind.css        Tokens de color (claro/oscuro) → utilidades bg-surface, text-muted, border-line, bg-abierto-bg…
├── material.scss       Tema de Material alineado a los tokens (índigo, esquinas 8px, Geist, light-dark())
├── testing/            Helpers de tests (sesión por rol, ticket de ejemplo)
└── app/
    ├── core/           models.ts (tipos = DTOs del backend), etiquetas.ts (textos/colores de enums,
    │                   acciones de transición, frases del historial), auth/ (AuthService, guards),
    │                   http/ (interceptor JWT + errores), api/ (servicios HTTP), tema.service.ts
    ├── layout/         Shell: menú lateral + barra superior + <router-outlet>
    ├── shared/         EstadoBadge, PrioridadBadge, Avatar, TiempoRelativoPipe, ConfirmarDialog
    └── features/
        ├── auth/       Login, Registro (AuthLayout con panel de marca)
        ├── dashboard/
        ├── tickets/    TicketList, TicketDetail, TicketFormDialog, CambiarEstadoDialog, AsignarDialog
        └── admin/      Usuarios, Categorias, CategoriaDialog
```

## Convenciones

- Nombres de archivo al estilo Angular 22: `ticket-list.ts` + `ticket-list.html`, clase `TicketList` (sin sufijo `Component`).
- Componentes con `ChangeDetectionStrategy.OnPush`, estado en `signal`/`computed`, `inject()` en vez de constructor.
- Rutas con `loadComponent` (lazy) y `withComponentInputBinding()`: `:id` y query params (`?q=`, `?sesion=`) llegan como `input()`.
- **Colores**: nunca hex en los componentes; usar las utilidades de `tailwind.css`. Clases dinámicas escritas completas en TS (`etiquetas.ts`) para que Tailwind las detecte.
- Importante de Tailwind 4 con sufijo: `hidden!`, `bg-nav-active!` (los estilos de Material no están en capas y ganan a las utilidades).
- **Reglas de negocio**: no se duplican. Los botones de estado salen de `ticket.transicionesPermitidas` y la edición de `ticket.editable`; la UI solo oculta lo que el backend igual rechazaría.
- **Errores**: el interceptor muestra el `detail` del ProblemDetail en un snackbar. Un 401 con sesión cierra la sesión. Para manejar el error en el propio componente (p. ej. el login), enviar la petición con el contexto `SILENCIAR_ERRORES`.
- Sesión (token + usuario + expiración) en `localStorage` (`tickets.sesion`); tema en `tickets.tema`. El tema se aplica antes de arrancar Angular con un script inline en `index.html`.
- Modo oscuro: clase `dark` en `<html>` (TemaService). Tailwind usa `@custom-variant dark`; Material usa `color-scheme` + `light-dark()`.

## Preview en Claude Code

`.claude/launch.json` define `backend` y `frontend`. El backend recibe `-Djdk.net.unixdomain.tmpdir=backend/target`: sin eso, en el entorno de preview Java falla con "Unable to establish loopback connection" (ruta temporal demasiado larga en Windows).

## Despliegue

- **Backend → Render**: `render.yaml` (Blueprint) construye `backend/Dockerfile` (multi-stage, JRE 21, heap limitado para 512 MB). Render define `PORT`, que `server.port` ya lee. Secretos solo en el panel de Render. Health check: `/v3/api-docs`. Plan Free: se duerme tras ~15 min sin tráfico.
- **Frontend → Vercel**: Root Directory `frontend`; `frontend/vercel.json` fija la salida `dist/tickets-web/browser` y reescribe todas las rutas a `index.html` (rutas de Angular). `ng build` usa `environment.prod.ts` (URL de Render) por `fileReplacements`. Node 24 (`engines` en `package.json`).
- Tras cambiar la URL del frontend, actualizar `CORS_ALLOWED_ORIGINS` en Render.
- Ambos se redespliegan solos con cada `git push` a `main`.
