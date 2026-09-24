package com.carlos.tickets.usuario;

import java.util.List;

import com.carlos.tickets.common.exception.RecursoNoEncontradoException;
import com.carlos.tickets.common.exception.ReglaNegocioException;
import com.carlos.tickets.common.security.UsuarioAutenticado;
import com.carlos.tickets.usuario.dto.UsuarioResponse;
import com.carlos.tickets.usuario.dto.UsuarioResumen;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UsuarioService {

	private final UsuarioRepository usuarioRepository;

	@Transactional(readOnly = true)
	public Page<UsuarioResponse> listar(Pageable pageable) {
		return usuarioRepository.findAll(pageable).map(UsuarioResponse::from);
	}

	@Transactional(readOnly = true)
	public UsuarioResponse obtener(Long id) {
		return UsuarioResponse.from(buscar(id));
	}

	@Transactional(readOnly = true)
	public List<UsuarioResumen> listarTecnicos() {
		return usuarioRepository.findByRolAndActivoTrueOrderByNombre(Rol.TECNICO).stream()
				.map(UsuarioResumen::from)
				.toList();
	}

	@Transactional
	public UsuarioResponse cambiarRol(Long id, Rol rol, UsuarioAutenticado actual) {
		if (id.equals(actual.id())) {
			throw new ReglaNegocioException("No puedes cambiar tu propio rol");
		}
		Usuario usuario = buscar(id);
		usuario.setRol(rol);
		return UsuarioResponse.from(usuario);
	}

	@Transactional
	public UsuarioResponse cambiarEstado(Long id, boolean activo, UsuarioAutenticado actual) {
		if (id.equals(actual.id())) {
			throw new ReglaNegocioException("No puedes activar o desactivar tu propia cuenta");
		}
		Usuario usuario = buscar(id);
		usuario.setActivo(activo);
		return UsuarioResponse.from(usuario);
	}

	Usuario buscar(Long id) {
		return usuarioRepository.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("Usuario", id));
	}

}
