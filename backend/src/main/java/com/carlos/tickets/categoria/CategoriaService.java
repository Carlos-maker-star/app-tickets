package com.carlos.tickets.categoria;

import java.util.List;

import com.carlos.tickets.categoria.dto.CategoriaRequest;
import com.carlos.tickets.categoria.dto.CategoriaResponse;
import com.carlos.tickets.common.exception.RecursoNoEncontradoException;
import com.carlos.tickets.common.exception.ReglaNegocioException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CategoriaService {

	private final CategoriaRepository categoriaRepository;

	@Transactional(readOnly = true)
	public List<CategoriaResponse> listar(boolean incluirInactivas) {
		List<Categoria> categorias = incluirInactivas
				? categoriaRepository.findAllByOrderByNombre()
				: categoriaRepository.findByActivaTrueOrderByNombre();
		return categorias.stream().map(CategoriaResponse::from).toList();
	}

	@Transactional
	public CategoriaResponse crear(CategoriaRequest request) {
		String nombre = request.nombre().trim();
		if (categoriaRepository.existsByNombreIgnoreCase(nombre)) {
			throw new ReglaNegocioException("Ya existe una categoría con ese nombre");
		}
		return CategoriaResponse.from(categoriaRepository.save(new Categoria(nombre, request.descripcion())));
	}

	@Transactional
	public CategoriaResponse actualizar(Long id, CategoriaRequest request) {
		Categoria categoria = buscar(id);
		String nombre = request.nombre().trim();
		if (categoriaRepository.existsByNombreIgnoreCaseAndIdNot(nombre, id)) {
			throw new ReglaNegocioException("Ya existe una categoría con ese nombre");
		}
		categoria.setNombre(nombre);
		categoria.setDescripcion(request.descripcion());
		categoria.setActiva(true);
		return CategoriaResponse.from(categoria);
	}

	/** Borrado lógico: los tickets existentes conservan su categoría. */
	@Transactional
	public void desactivar(Long id) {
		buscar(id).setActiva(false);
	}

	/** Categoría activa, para asignarla a un ticket. Se usa dentro de la transacción del llamador. */
	public Categoria buscarActiva(Long id) {
		Categoria categoria = buscar(id);
		if (!categoria.isActiva()) {
			throw new ReglaNegocioException("La categoría '" + categoria.getNombre() + "' está desactivada");
		}
		return categoria;
	}

	private Categoria buscar(Long id) {
		return categoriaRepository.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("Categoría", id));
	}

}
