package com.carlos.tickets.historial.dto;

import java.time.Instant;

import com.carlos.tickets.historial.AccionHistorial;
import com.carlos.tickets.historial.HistorialTicket;
import com.carlos.tickets.usuario.dto.UsuarioResumen;

public record HistorialResponse(Long id, AccionHistorial accion, String valorAnterior, String valorNuevo,
		UsuarioResumen usuario, Instant createdAt) {

	public static HistorialResponse from(HistorialTicket historial) {
		return new HistorialResponse(historial.getId(), historial.getAccion(), historial.getValorAnterior(),
				historial.getValorNuevo(), UsuarioResumen.from(historial.getUsuario()), historial.getCreatedAt());
	}

}
