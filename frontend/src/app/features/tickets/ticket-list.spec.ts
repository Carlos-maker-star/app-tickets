import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { iniciarSesionComo, ticketDePrueba } from '../../../testing/sesion';
import { TicketList } from './ticket-list';

describe('TicketList', () => {
  const api = environment.apiUrl;
  let backend: HttpTestingController;

  function crear(q?: string) {
    TestBed.configureTestingModule({
      imports: [TicketList],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    backend = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TicketList);
    if (q) {
      fixture.componentRef.setInput('q', q);
    }
    fixture.detectChanges();
    backend.expectOne(`${api}/categorias?todas=false`).flush([{ id: 1, nombre: 'Hardware', descripcion: null, activa: true }]);
    return fixture;
  }

  function peticionTickets(): TestRequest {
    return backend.expectOne((r) => r.url === `${api}/tickets`);
  }

  afterEach(() => localStorage.clear());

  it('pinta las filas que devuelve la API', async () => {
    iniciarSesionComo('ADMIN');
    const fixture = crear();
    backend.expectOne(`${api}/usuarios/tecnicos`).flush([]);

    const req = peticionTickets();
    expect(req.request.params.get('sort')).toBe('createdAt,desc');
    expect(req.request.params.get('size')).toBe('10');
    req.flush({ contenido: [ticketDePrueba()], pagina: 0, tamanio: 10, totalElementos: 1, totalPaginas: 1 });
    await fixture.whenStable();

    const texto = (fixture.nativeElement as HTMLElement).textContent!;
    expect(texto).toContain('TCK-000042');
    expect(texto).toContain('Pantalla parpadea al conectar el proyector');
    expect(texto).toContain('En progreso');
    expect(texto).toContain('1 ticket');
  });

  it('envía la búsqueda de la barra superior a la API', async () => {
    iniciarSesionComo('TECNICO');
    const fixture = crear('proyector');
    backend.expectOne(`${api}/usuarios/tecnicos`).flush([]);

    expect(peticionTickets().request.params.get('q')).toBe('proyector');
    await fixture.whenStable();
  });

  it('un USUARIO no pide la lista de técnicos (el backend se la negaría)', async () => {
    iniciarSesionComo('USUARIO');
    const fixture = crear();

    backend.expectNone(`${api}/usuarios/tecnicos`);
    peticionTickets().flush({ contenido: [], pagina: 0, tamanio: 10, totalElementos: 0, totalPaginas: 0 });
    await fixture.whenStable();

    const texto = (fixture.nativeElement as HTMLElement).textContent!;
    expect(texto).toContain('Todavía no hay tickets');
    expect(texto).not.toContain('Sin asignar');
  });
});
