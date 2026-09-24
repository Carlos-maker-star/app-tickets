package com.carlos.tickets.historial;

import java.util.List;

import com.carlos.tickets.common.security.UsuarioAutenticado;
import com.carlos.tickets.historial.dto.HistorialResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class HistorialController {

	private final HistorialService historialService;

	@GetMapping("/api/v1/tickets/{ticketId}/historial")
	public List<HistorialResponse> listar(@PathVariable Long ticketId,
			@AuthenticationPrincipal UsuarioAutenticado usuario) {
		return historialService.listar(ticketId, usuario);
	}

}
