package com.carlos.tickets.comentario;

import java.util.List;

import com.carlos.tickets.comentario.dto.ComentarioResponse;
import com.carlos.tickets.comentario.dto.CrearComentarioRequest;
import com.carlos.tickets.common.security.UsuarioAutenticado;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tickets/{ticketId}/comentarios")
@RequiredArgsConstructor
public class ComentarioController {

	private final ComentarioService comentarioService;

	@GetMapping
	public List<ComentarioResponse> listar(@PathVariable Long ticketId,
			@AuthenticationPrincipal UsuarioAutenticado usuario) {
		return comentarioService.listar(ticketId, usuario);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ComentarioResponse crear(@PathVariable Long ticketId, @Valid @RequestBody CrearComentarioRequest request,
			@AuthenticationPrincipal UsuarioAutenticado usuario) {
		return comentarioService.crear(ticketId, request, usuario);
	}

}
