package com.carlos.tickets.categoria.dto;

import com.carlos.tickets.categoria.Categoria;

public record CategoriaResumen(Long id, String nombre) {

	public static CategoriaResumen from(Categoria categoria) {
		return new CategoriaResumen(categoria.getId(), categoria.getNombre());
	}

}
