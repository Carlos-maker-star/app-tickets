package com.carlos.tickets.ticket;

import com.carlos.tickets.common.dto.PaginaResponse;
import com.carlos.tickets.common.security.UsuarioAutenticado;
import com.carlos.tickets.ticket.dto.ActualizarTicketRequest;
import com.carlos.tickets.ticket.dto.AsignarTicketRequest;
import com.carlos.tickets.ticket.dto.CambiarEstadoRequest;
import com.carlos.tickets.ticket.dto.CrearTicketRequest;
import com.carlos.tickets.ticket.dto.TicketFiltro;
import com.carlos.tickets.ticket.dto.TicketResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

	private final TicketService ticketService;

	@GetMapping
	public PaginaResponse<TicketResponse> listar(@ParameterObject TicketFiltro filtro,
			@ParameterObject @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
			@AuthenticationPrincipal UsuarioAutenticado usuario) {
		return PaginaResponse.from(ticketService.listar(filtro, pageable, usuario));
	}

	@GetMapping("/{id}")
	public TicketResponse obtener(@PathVariable Long id, @AuthenticationPrincipal UsuarioAutenticado usuario) {
		return ticketService.obtener(id, usuario);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public TicketResponse crear(@Valid @RequestBody CrearTicketRequest request,
			@AuthenticationPrincipal UsuarioAutenticado usuario) {
		return ticketService.crear(request, usuario);
	}

	@PutMapping("/{id}")
	public TicketResponse actualizar(@PathVariable Long id, @Valid @RequestBody ActualizarTicketRequest request,
			@AuthenticationPrincipal UsuarioAutenticado usuario) {
		return ticketService.actualizar(id, request, usuario);
	}

	@PatchMapping("/{id}/estado")
	public TicketResponse cambiarEstado(@PathVariable Long id, @Valid @RequestBody CambiarEstadoRequest request,
			@AuthenticationPrincipal UsuarioAutenticado usuario) {
		return ticketService.cambiarEstado(id, request, usuario);
	}

	@PatchMapping("/{id}/asignacion")
	@PreAuthorize("hasAnyRole('TECNICO', 'ADMIN')")
	public TicketResponse asignar(@PathVariable Long id, @Valid @RequestBody AsignarTicketRequest request,
			@AuthenticationPrincipal UsuarioAutenticado usuario) {
		return ticketService.asignar(id, request, usuario);
	}

}
