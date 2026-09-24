import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Categoria } from '../models';

export interface CategoriaForm {
  nombre: string;
  descripcion: string | null;
}

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/categorias`;

  /** `todas` solo tiene efecto para ADMIN (incluye las desactivadas). */
  listar(todas = false): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.url, { params: { todas } });
  }

  crear(datos: CategoriaForm): Observable<Categoria> {
    return this.http.post<Categoria>(this.url, datos);
  }

  /** También reactiva una categoría desactivada. */
  actualizar(id: number, datos: CategoriaForm): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.url}/${id}`, datos);
  }

  desactivar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
