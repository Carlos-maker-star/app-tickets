import { AccionHistorial, EstadoTicket, Historial, Prioridad, Rol } from './models';

// Textos y clases visuales de los enums. Las clases están escritas completas para que
// Tailwind las detecte al escanear este archivo.

export const ESTADOS: Record<EstadoTicket, { etiqueta: string; clases: string; barra: string }> = {
  ABIERTO: { etiqueta: 'Abierto', clases: 'bg-abierto-bg text-abierto-fg', barra: 'bg-abierto-fg' },
  EN_PROGRESO: { etiqueta: 'En progreso', clases: 'bg-progreso-bg text-progreso-fg', barra: 'bg-progreso-fg' },
  EN_ESPERA: { etiqueta: 'En espera', clases: 'bg-espera-bg text-espera-fg', barra: 'bg-espera-fg' },
  RESUELTO: { etiqueta: 'Resuelto', clases: 'bg-resuelto-bg text-resuelto-fg', barra: 'bg-resuelto-fg' },
  CERRADO: { etiqueta: 'Cerrado', clases: 'bg-cerrado-bg text-cerrado-fg', barra: 'bg-cerrado-fg' },
};

export const PRIORIDADES: Record<Prioridad, { etiqueta: string; punto: string }> = {
  BAJA: { etiqueta: 'Baja', punto: 'bg-baja' },
  MEDIA: { etiqueta: 'Media', punto: 'bg-media' },
  ALTA: { etiqueta: 'Alta', punto: 'bg-alta' },
  CRITICA: { etiqueta: 'Crítica', punto: 'bg-critica' },
};

export const ROLES: Record<Rol, string> = {
  USUARIO: 'Usuario',
  TECNICO: 'Técnico',
  ADMIN: 'Administrador',
};

export const LISTA_ESTADOS = Object.keys(ESTADOS) as EstadoTicket[];
export const LISTA_PRIORIDADES = Object.keys(PRIORIDADES) as Prioridad[];
export const LISTA_ROLES = Object.keys(ROLES) as Rol[];

/** Estados en los que un ticket todavía admite asignación (igual que TicketService del backend). */
export const ESTADOS_ASIGNABLES: EstadoTicket[] = ['ABIERTO', 'EN_PROGRESO', 'EN_ESPERA'];

export type EstiloAccion = 'primario' | 'secundario' | 'peligro';

export interface AccionTransicion {
  destino: EstadoTicket;
  etiqueta: string;
  icono: string;
  estilo: EstiloAccion;
  titulo: string;
  descripcion: string;
  placeholderComentario: string;
}

/** Cómo se presenta cada transición de estado en la UI (botón + diálogo de confirmación). */
export function accionTransicion(origen: EstadoTicket, destino: EstadoTicket): AccionTransicion {
  const base = { destino, placeholderComentario: 'Comentario opcional para el ticket' };
  switch (`${origen}>${destino}`) {
    case 'ABIERTO>EN_PROGRESO':
      return { ...base, etiqueta: 'Iniciar atención', icono: 'play_arrow', estilo: 'primario',
        titulo: 'Iniciar atención', descripcion: 'El ticket pasará a En progreso.' };
    case 'EN_ESPERA>EN_PROGRESO':
      return { ...base, etiqueta: 'Reanudar', icono: 'play_arrow', estilo: 'primario',
        titulo: 'Reanudar ticket', descripcion: 'El ticket volverá a En progreso.' };
    case 'EN_PROGRESO>EN_ESPERA':
      return { ...base, etiqueta: 'Poner en espera', icono: 'pause', estilo: 'secundario',
        titulo: 'Poner en espera',
        descripcion: 'Úsalo cuando necesites información del usuario. Volverá a En progreso automáticamente cuando el usuario responda.',
        placeholderComentario: '¿Qué información necesitas del usuario?' };
    case 'EN_PROGRESO>RESUELTO':
      return { ...base, etiqueta: 'Marcar resuelto', icono: 'check', estilo: 'primario',
        titulo: 'Marcar como resuelto',
        descripcion: 'El usuario podrá confirmar la solución y cerrar el ticket, o reabrirlo.',
        placeholderComentario: 'Describe la solución aplicada' };
    case 'RESUELTO>CERRADO':
      return { ...base, etiqueta: 'Confirmar y cerrar', icono: 'task_alt', estilo: 'primario',
        titulo: 'Cerrar ticket', descripcion: 'Un ticket cerrado ya no admite cambios ni comentarios.' };
    case 'RESUELTO>ABIERTO':
      return { ...base, etiqueta: 'Reabrir', icono: 'replay', estilo: 'secundario',
        titulo: 'Reabrir ticket', descripcion: 'El ticket volverá a estar Abierto.',
        placeholderComentario: 'Cuéntanos qué sigue fallando' };
    case 'ABIERTO>CERRADO':
      return { ...base, etiqueta: 'Cancelar ticket', icono: 'block', estilo: 'peligro',
        titulo: 'Cancelar ticket', descripcion: 'El ticket se cerrará sin atenderse. Esta acción no se puede deshacer.',
        placeholderComentario: 'Motivo de la cancelación (opcional)' };
    default:
      return { ...base, etiqueta: ESTADOS[destino].etiqueta, icono: 'arrow_forward', estilo: 'secundario',
        titulo: `Cambiar a ${ESTADOS[destino].etiqueta}`, descripcion: '' };
  }
}

/** Frase legible para una entrada del historial ("cambió el estado de Abierto a En progreso"). */
export function describirHistorial(h: Historial): string {
  const acciones: Record<AccionHistorial, () => string> = {
    CREADO: () => 'creó el ticket',
    ESTADO: () => `cambió el estado de ${etiquetaEstado(h.valorAnterior)} a ${etiquetaEstado(h.valorNuevo)}`,
    ASIGNACION: () =>
      h.valorAnterior ? `reasignó el ticket de ${h.valorAnterior} a ${h.valorNuevo}` : `asignó el ticket a ${h.valorNuevo}`,
    PRIORIDAD: () =>
      `cambió la prioridad de ${etiquetaPrioridad(h.valorAnterior)} a ${etiquetaPrioridad(h.valorNuevo)}`,
    EDICION: () => `editó ${h.valorNuevo ?? 'el ticket'}`,
  };
  return acciones[h.accion]();
}

function etiquetaEstado(valor: string | null): string {
  return valor && valor in ESTADOS ? ESTADOS[valor as EstadoTicket].etiqueta : (valor ?? '');
}

function etiquetaPrioridad(valor: string | null): string {
  return valor && valor in PRIORIDADES ? PRIORIDADES[valor as Prioridad].etiqueta : (valor ?? '');
}
