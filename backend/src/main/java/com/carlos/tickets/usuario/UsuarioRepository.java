package com.carlos.tickets.usuario;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

	Optional<Usuario> findByEmailIgnoreCase(String email);

	boolean existsByEmailIgnoreCase(String email);

	boolean existsByRol(Rol rol);

	List<Usuario> findByRolAndActivoTrueOrderByNombre(Rol rol);

}
