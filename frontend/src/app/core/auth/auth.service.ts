import { HttpClient, HttpContext } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SILENCIAR_ERRORES } from '../http/contexto';
import { AuthResponse, Rol, Usuario } from '../models';

const CLAVE_SESION = 'tickets.sesion';

interface Sesion {
  token: string;
  /** Epoch en ms en que expira el JWT. */
  expiraEn: number;
  usuario: Usuario;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly url = `${environment.apiUrl}/auth`;

  private readonly sesion = signal<Sesion | null>(leerSesion());

  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly token = computed(() => this.sesion()?.token ?? null);
  readonly autenticado = computed(() => this.sesion() !== null);
  readonly rol = computed(() => this.usuario()?.rol ?? null);
  readonly esAdmin = computed(() => this.rol() === 'ADMIN');
  readonly esTecnico = computed(() => this.rol() === 'TECNICO');
  readonly esUsuario = computed(() => this.rol() === 'USUARIO');
  /** TECNICO o ADMIN: ven todos los tickets, comentarios internos y filtros de asignación. */
  readonly esStaff = computed(() => this.esTecnico() || this.esAdmin());

  /** Errores de credenciales se muestran en el formulario, no como aviso global. */
  login(email: string, password: string): Observable<Usuario> {
    return this.http
      .post<AuthResponse>(`${this.url}/login`, { email, password }, { context: silencioso() })
      .pipe(tap((r) => this.guardar(r)), map((r) => r.usuario));
  }

  registrar(nombre: string, email: string, password: string): Observable<Usuario> {
    return this.http
      .post<AuthResponse>(`${this.url}/register`, { nombre, email, password }, { context: silencioso() })
      .pipe(tap((r) => this.guardar(r)), map((r) => r.usuario));
  }

  /** Recarga el usuario desde el backend (por si un ADMIN le cambió el rol). */
  refrescarUsuario(): void {
    if (!this.autenticado()) {
      return;
    }
    this.http.get<Usuario>(`${this.url}/me`).subscribe((usuario) => {
      const actual = this.sesion();
      if (actual) {
        this.persistir({ ...actual, usuario });
      }
    });
  }

  logout(motivo?: 'expirada'): void {
    this.persistir(null);
    this.router.navigate(['/login'], motivo ? { queryParams: { sesion: motivo } } : {});
  }

  tieneRol(...roles: Rol[]): boolean {
    const rol = this.rol();
    return rol !== null && roles.includes(rol);
  }

  private guardar(respuesta: AuthResponse): void {
    this.persistir({
      token: respuesta.token,
      expiraEn: Date.now() + respuesta.expiraEnSegundos * 1000,
      usuario: respuesta.usuario,
    });
  }

  private persistir(sesion: Sesion | null): void {
    this.sesion.set(sesion);
    try {
      if (sesion) {
        localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
      } else {
        localStorage.removeItem(CLAVE_SESION);
      }
    } catch {
      // Sin almacenamiento (modo privado): la sesión dura lo que la pestaña.
    }
  }
}

function leerSesion(): Sesion | null {
  try {
    const guardada = localStorage.getItem(CLAVE_SESION);
    if (!guardada) {
      return null;
    }
    const sesion = JSON.parse(guardada) as Sesion;
    return sesion.expiraEn > Date.now() ? sesion : null;
  } catch {
    return null;
  }
}

function silencioso(): HttpContext {
  return new HttpContext().set(SILENCIAR_ERRORES, true);
}
