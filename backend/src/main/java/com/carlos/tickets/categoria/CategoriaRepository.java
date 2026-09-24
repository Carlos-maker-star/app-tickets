package com.carlos.tickets.categoria;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

	List<Categoria> findByActivaTrueOrderByNombre();

	List<Categoria> findAllByOrderByNombre();

	boolean existsByNombreIgnoreCase(String nombre);

	boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Long id);

}
