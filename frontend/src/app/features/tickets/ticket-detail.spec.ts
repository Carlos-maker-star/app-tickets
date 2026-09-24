import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { iniciarSesionComo, ticketDePrueba } from '../../../testing/sesion';
import { authInterceptor } from '../../core/http/auth.interceptor';
import { Comentario, Ticket } from '../../core/models';
import { TicketDetail } from './ticket-detail';

describe('TicketDetail', () => {
  const url = `${environment.apiUrl}/tickets/42`;
  let fixture: ComponentFixture<TicketDetail>;
  let backend: HttpTestingController;

  async function abrir(ticket: Ticket, comentarios: Comentario[] = []): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      imports: [TicketDetail],
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    backend = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TicketDetail);
    fixture.componentRef.setInput('id', '42');
    fixture.detectChanges();

    backend.expectOne(url).flush(ticket);
    backend.expectOne(`${url}/comentarios`).flush(comentarios);
    backend.expectOne(`${url}/historial`).flush([
      {
        id: 1, accion: 'CREADO', valorAnterior: null, valorNuevo: 'ABIERTO',
        usuario: ticket.creador, createdAt: ticket.createdAt,
      },
    ]);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  function botones(el: HTMLElement): string[] {
    return [...el.querySelectorAll('button')].map((b) => b.textContent!.replace(/\s+/g, ' ').trim());
  }

  afterEach(() => localStorage.clear());

  it('muestra solo las acciones que permite el backend, con la principal al final', async () => {
    iniciarSesionComo('TECNICO', 2, 'Tito Ramos');
    const el = await abrir(ticketDePrueba());

    const acciones = botones(el).filter((b) => b.includes('espera') || b.includes('resuelto'));
    expect(acciones).toEqual(['pause Poner en espera', 'check Marcar resuelto']);
    expect(botones(el).some((b) => b.includes('Cancelar ticket'))).toBe(false);
  });

  it('ofrece "Tomar ticket" a un técnico si nadie lo tiene asignado', async () => {
    iniciarSesionComo('TECNICO', 2);
    const el = await abrir(ticketDePrueba({ estado: 'ABIERTO', asignado: null, transicionesPermitidas: [] }));

    expect(botones(el)).toContain('front_hand Tomar ticket');
  });

  it('al usuario no le ofrece comentarios internos ni asignación', async () => {
    iniciarSesionComo('USUARIO', 7, 'Ana Torres');
    const el = await abrir(ticketDePrueba({ transicionesPermitidas: [], editable: false }));

    expect(el.textContent).not.toContain('Comentario interno');
    expect(el.textContent).not.toContain('Reasignar');
    expect(botones(el).some((b) => b.includes('Editar'))).toBe(false);
  });

  it('marca los comentarios internos para el staff', async () => {
    iniciarSesionComo('ADMIN', 1);
    const el = await abrir(ticketDePrueba(), [
      { id: 1, contenido: 'Falta el cable HDMI', interno: true, autor: { id: 2, nombre: 'Tito Ramos', email: 't@test.com' }, createdAt: '2026-09-23T09:00:00Z' },
    ]);

    expect(el.textContent).toContain('Interno');
    expect(el.textContent).toContain('Comentario interno (solo técnicos y administradores)');
    expect(el.textContent).toContain('Reasignar');
  });

  it('un ticket cerrado no admite comentarios', async () => {
    iniciarSesionComo('USUARIO', 7);
    const el = await abrir(ticketDePrueba({ estado: 'CERRADO', transicionesPermitidas: [], editable: false }));

    expect(el.querySelector('textarea')).toBeNull();
    expect(el.textContent).toContain('ya no admite comentarios');
  });

  it('muestra el aviso de "no encontrado" si la API falla', async () => {
    iniciarSesionComo('USUARIO', 7);
    TestBed.configureTestingModule({
      imports: [TicketDetail],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    backend = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TicketDetail);
    fixture.componentRef.setInput('id', '99');
    fixture.detectChanges();

    backend.expectOne(`${environment.apiUrl}/tickets/99`).flush(null, { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No pudimos abrir este ticket');
  });
});
