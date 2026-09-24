package com.carlos.tickets.common.exception;

/** Operación bien formada pero no permitida por el estado actual de los datos (409). */
public class ReglaNegocioException extends RuntimeException {

	public ReglaNegocioException(String mensaje) {
		super(mensaje);
	}

}
