import { accionTransicion, describirHistorial } from './etiquetas';
import { Historial } from './models';

describe('accionTransicion', () => {
  it('presenta la cancelación como acción de peligro', () => {
    const accion = accionTransicion('ABIERTO', 'CERRADO');
    expect(accion.etiqueta).toBe('Cancelar ticket');
    expect(accion.estilo).toBe('peligro');
  });

  it('distingue cerrar un ticket resuelto de cancelarlo', () => {
    expect(accionTransicion('RESUELTO', 'CERRADO').etiqueta).toBe('Confirmar y cerrar');
    expect(accionTransicion('RESUELTO', 'CERRADO').estilo).toBe('primario');
  });

  it('usa textos distintos para iniciar y reanudar', () => {
    expect(accionTransicion('ABIERTO', 'EN_PROGRESO').etiqueta).toBe('Iniciar atención');
    expect(accionTransicion('EN_ESPERA', 'EN_PROGRESO').etiqueta).toBe('Reanudar');
  });
});

describe('describirHistorial', () => {
  const base: Omit<Historial, 'accion' | 'valorAnterior' | 'valorNuevo'> = {
    id: 1,
    usuario: { id: 1, nombre: 'Ana', email: 'ana@test.com' },
    createdAt: '2026-09-23T10:00:00Z',
  };

  it('traduce los estados del cambio', () => {
    const texto = describirHistorial({ ...base, accion: 'ESTADO', valorAnterior: 'EN_PROGRESO', valorNuevo: 'RESUELTO' });
    expect(texto).toBe('cambió el estado de En progreso a Resuelto');
  });

  it('distingue asignar de reasignar', () => {
    expect(describirHistorial({ ...base, accion: 'ASIGNACION', valorAnterior: null, valorNuevo: 'Tito' }))
      .toBe('asignó el ticket a Tito');
    expect(describirHistorial({ ...base, accion: 'ASIGNACION', valorAnterior: 'Tito', valorNuevo: 'Lucía' }))
      .toBe('reasignó el ticket de Tito a Lucía');
  });

  it('traduce las prioridades', () => {
    expect(describirHistorial({ ...base, accion: 'PRIORIDAD', valorAnterior: 'MEDIA', valorNuevo: 'CRITICA' }))
      .toBe('cambió la prioridad de Media a Crítica');
  });
});
