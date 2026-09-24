import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { iniciarSesionComo } from '../../../testing/sesion';
import { AuthService } from '../auth/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  function configurar(): void {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  }

  afterEach(() => localStorage.clear());

  it('añade el token a las llamadas a la API', () => {
    iniciarSesionComo('USUARIO');
    configurar();

    http.get(`${environment.apiUrl}/tickets`).subscribe();

    const req = backend.expectOne(`${environment.apiUrl}/tickets`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
  });

  it('no envía el token a otros dominios', () => {
    iniciarSesionComo('USUARIO');
    configurar();

    http.get('https://fonts.googleapis.com/css2').subscribe();

    expect(backend.expectOne('https://fonts.googleapis.com/css2').request.headers.has('Authorization')).toBe(false);
  });

  it('cierra la sesión si la API responde 401', () => {
    iniciarSesionComo('TECNICO');
    configurar();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    http.get(`${environment.apiUrl}/tickets`).subscribe({ error: () => {} });
    backend.expectOne(`${environment.apiUrl}/tickets`).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(TestBed.inject(AuthService).autenticado()).toBe(false);
    expect(navegar).toHaveBeenCalledWith(['/login'], { queryParams: { sesion: 'expirada' } });
  });
});
