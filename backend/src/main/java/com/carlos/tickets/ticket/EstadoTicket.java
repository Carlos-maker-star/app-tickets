package com.carlos.tickets.ticket;

/** Las transiciones permitidas entre estados están en {@link TransicionEstado}. */
public enum EstadoTicket {
	ABIERTO,
	EN_PROGRESO,
	EN_ESPERA,
	RESUELTO,
	CERRADO
}
