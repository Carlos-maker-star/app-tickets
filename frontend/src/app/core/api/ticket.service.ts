import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Comentario,
  EstadoTicket,
  Historial,
  Pagina,
  Ticket,
  TicketFiltro,
  TicketForm,
} from '../models';

export interface Paginacion {
  pagina: number;
  tamanio: number;
  /** Formato Spring: "campo,asc|desc". */
  orden?: string;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/tickets`;

  listar(filtro: TicketFiltro, paginacion: Paginacion): Observable<Pagina<Ticket>> {
    let params = new HttpParams()
      .set('page', paginacion.pagina)
      .set('size', paginacion.tamanio)
      .set('sort', paginacion.orden ?? 'createdAt,desc');
    for (const [clave, valor] of Object.entries(filtro)) {
      if (valor !== null && valor !== undefined && valor !== '' && valor !== false) {
        params = params.set(clave, String(valor));
      }
    }
    return this.http.get<Pagina<Ticket>>(this.url, { params });
  }

  obtener(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.url}/${id}`);
  }

  crear(datos: TicketForm): Observable<Ticket> {
    return this.http.post<Ticket>(this.url, datos);
  }

  actualizar(id: number, datos: TicketForm): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.url}/${id}`, datos);
  }

  cambiarEstado(id: number, estado: EstadoTicket, comentario?: string): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.url}/${id}/estado`, { estado, comentario: comentario || null });
  }

  asignar(id: number, tecnicoId: number): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.url}/${id}/asignacion`, { tecnicoId });
  }

  comentarios(id: number): Observable<Comentario[]> {
    return this.http.get<Comentario[]>(`${this.url}/${id}/comentarios`);
  }

  comentar(id: number, contenido: string, interno: boolean): Observable<Comentario> {
    return this.http.post<Comentario>(`${this.url}/${id}/comentarios`, { contenido, interno });
  }

  historial(id: number): Observable<Historial[]> {
    return this.http.get<Historial[]>(`${this.url}/${id}/historial`);
  }
}
