// Tipos que reflejan los DTOs del backend (backend/src/main/java/com/carlos/tickets/**/dto).

export type Rol = 'USUARIO' | 'TECNICO' | 'ADMIN';
export type EstadoTicket = 'ABIERTO' | 'EN_PROGRESO' | 'EN_ESPERA' | 'RESUELTO' | 'CERRADO';
export type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type AccionHistorial = 'CREADO' | 'ESTADO' | 'ASIGNACION' | 'PRIORIDAD' | 'EDICION';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  createdAt: string;
}

export interface UsuarioResumen {
  id: number;
  nombre: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  tipo: string;
  expiraEnSegundos: number;
  usuario: Usuario;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
}

export interface CategoriaResumen {
  id: number;
  nombre: string;
}

export interface Ticket {
  id: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  estado: EstadoTicket;
  prioridad: Prioridad;
  categoria: CategoriaResumen;
  creador: UsuarioResumen;
  asignado: UsuarioResumen | null;
  createdAt: string;
  updatedAt: string;
  resueltoAt: string | null;
  cerradoAt: string | null;
  /** Estados a los que el usuario actual puede mover el ticket (lo calcula el backend). */
  transicionesPermitidas: EstadoTicket[];
  /** Si el usuario actual puede editar título, descripción, categoría y prioridad. */
  editable: boolean;
}

export interface Comentario {
  id: number;
  contenido: string;
  interno: boolean;
  autor: UsuarioResumen;
  createdAt: string;
}

export interface Historial {
  id: number;
  accion: AccionHistorial;
  valorAnterior: string | null;
  valorNuevo: string | null;
  usuario: UsuarioResumen;
  createdAt: string;
}

export interface Pagina<T> {
  contenido: T[];
  pagina: number;
  tamanio: number;
  totalElementos: number;
  totalPaginas: number;
}

export interface Resumen {
  total: number;
  porEstado: Record<EstadoTicket, number>;
  porPrioridad: Record<Prioridad, number>;
  sinAsignar: number | null;
  asignadosAMi: number | null;
}

export interface TicketFiltro {
  estado?: EstadoTicket | null;
  prioridad?: Prioridad | null;
  categoriaId?: number | null;
  asignadoId?: number | null;
  sinAsignar?: boolean | null;
  q?: string | null;
}

export interface TicketForm {
  titulo: string;
  descripcion: string;
  categoriaId: number;
  prioridad: Prioridad;
}

/** Cuerpo de error RFC 7807 que devuelve GlobalExceptionHandler. */
export interface ProblemDetail {
  title?: string;
  status: number;
  detail?: string;
  errores?: Record<string, string>;
}
