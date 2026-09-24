import { Rol, Ticket } from '../app/core/models';

/** Deja una sesión guardada como la que escribe AuthService, para arrancar los tests con un rol. */
export function iniciarSesionComo(rol: Rol, id = 1, nombre = 'Usuario de prueba'): void {
  localStorage.setItem(
    'tickets.sesion',
    JSON.stringify({
      token: 'token-de-prueba',
      expiraEn: Date.now() + 3_600_000,
      usuario: { id, nombre, email: `u${id}@test.com`, rol, activo: true, createdAt: '2026-09-01T00:00:00Z' },
    }),
  );
}

export function ticketDePrueba(cambios: Partial<Ticket> = {}): Ticket {
  return {
    id: 42,
    codigo: 'TCK-000042',
    titulo: 'Pantalla parpadea al conectar el proyector',
    descripcion: 'Pasa en la sala B.',
    estado: 'EN_PROGRESO',
    prioridad: 'ALTA',
    categoria: { id: 1, nombre: 'Hardware' },
    creador: { id: 7, nombre: 'Ana Torres', email: 'ana@test.com' },
    asignado: { id: 2, nombre: 'Tito Ramos', email: 'tito@test.com' },
    createdAt: '2026-09-22T16:40:00Z',
    updatedAt: '2026-09-23T10:00:00Z',
    resueltoAt: null,
    cerradoAt: null,
    transicionesPermitidas: ['EN_ESPERA', 'RESUELTO'],
    editable: true,
    ...cambios,
  };
}
