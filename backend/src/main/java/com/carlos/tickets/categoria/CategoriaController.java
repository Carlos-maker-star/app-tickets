package com.carlos.tickets.categoria;

import java.util.List;

import com.carlos.tickets.categoria.dto.CategoriaRequest;
import com.carlos.tickets.categoria.dto.CategoriaResponse;
import com.carlos.tickets.common.security.UsuarioAutenticado;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/categorias")
@RequiredArgsConstructor
public class CategoriaController {

	private final CategoriaService categoriaService;

	/** Solo ADMIN puede ver también las desactivadas ({@code ?todas=true}). */
	@GetMapping
	public List<CategoriaResponse> listar(@RequestParam(defaultValue = "false") boolean todas,
			@AuthenticationPrincipal UsuarioAutenticado usuario) {
		return categoriaService.listar(todas && usuario.esAdmin());
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasRole('ADMIN')")
	public CategoriaResponse crear(@Valid @RequestBody CategoriaRequest request) {
		return categoriaService.crear(request);
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public CategoriaResponse actualizar(@PathVariable Long id, @Valid @RequestBody CategoriaRequest request) {
		return categoriaService.actualizar(id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasRole('ADMIN')")
	public void desactivar(@PathVariable Long id) {
		categoriaService.desactivar(id);
	}

}
