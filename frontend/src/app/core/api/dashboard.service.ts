import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Resumen } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  resumen(): Observable<Resumen> {
    return this.http.get<Resumen>(`${environment.apiUrl}/dashboard/resumen`);
  }
}
