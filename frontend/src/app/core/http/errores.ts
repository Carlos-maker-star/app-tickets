import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '../models';

/** Convierte un error HTTP (ProblemDetail del backend) en un mensaje para mostrar. */
export function mensajeDeError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Ocurrió un error inesperado';
  }
  if (error.status === 0) {
    return 'No se pudo conectar con el servidor. ¿Está corriendo el backend?';
  }
  const problema = error.error as ProblemDetail | null;
  const primerCampo = problema?.errores ? Object.values(problema.errores)[0] : null;
  return primerCampo ?? problema?.detail ?? `Error ${error.status}`;
}
