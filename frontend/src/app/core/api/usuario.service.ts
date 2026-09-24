import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina, Rol, Usuario, UsuarioResumen } from '../models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/usuarios`;

  listar(pagina: number, tamanio: number): Observable<Pagina<Usuario>> {
    return this.http.get<Pagina<Usuario>>(this.url, { params: { page: pagina, size: tamanio } });
  }

  /** Técnicos activos, para asignar tickets (TECNICO y ADMIN). */
  tecnicos(): Observable<UsuarioResumen[]> {
    return this.http.get<UsuarioResumen[]>(`${this.url}/tecnicos`);
  }

  cambiarRol(id: number, rol: Rol): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.url}/${id}/rol`, { rol });
  }

  cambiarEstado(id: number, activo: boolean): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.url}/${id}/estado`, { activo });
  }
}
