package com.carlos.tickets.usuario;

import java.util.List;

import com.carlos.tickets.common.dto.PaginaResponse;
import com.carlos.tickets.common.security.UsuarioAutenticado;
import com.carlos.tickets.usuario.dto.CambiarEstadoUsuarioRequest;
import com.carlos.tickets.usuario.dto.CambiarRolRequest;
import com.carlos.tickets.usuario.dto.UsuarioResponse;
import com.carlos.tickets.usuario.dto.UsuarioResumen;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

	private final UsuarioService usuarioService;

	@GetMapping
	@PreAuthorize("hasRole('ADMIN')")
	public PaginaResponse<UsuarioResponse> listar(
			@ParameterObject @PageableDefault(size = 20, sort = "nombre", direction = Sort.Direction.ASC) Pageable pageable) {
		return PaginaResponse.from(usuarioService.listar(pageable));
	}

	@GetMapping("/tecnicos")
	@PreAuthorize("hasAnyRole('TECNICO', 'ADMIN')")
	public List<UsuarioResumen> listarTecnicos() {
		return usuarioService.listarTecnicos();
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public UsuarioResponse obtener(@PathVariable Long id) {
		return usuarioService.obtener(id);
	}

	@PatchMapping("/{id}/rol")
	@PreAuthorize("hasRole('ADMIN')")
	public UsuarioResponse cambiarRol(@PathVariable Long id, @Valid @RequestBody CambiarRolRequest request,
			@AuthenticationPrincipal UsuarioAutenticado actual) {
		return usuarioService.cambiarRol(id, request.rol(), actual);
	}

	@PatchMapping("/{id}/estado")
	@PreAuthorize("hasRole('ADMIN')")
	public UsuarioResponse cambiarEstado(@PathVariable Long id, @Valid @RequestBody CambiarEstadoUsuarioRequest request,
			@AuthenticationPrincipal UsuarioAutenticado actual) {
		return usuarioService.cambiarEstado(id, request.activo(), actual);
	}

}
