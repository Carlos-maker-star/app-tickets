package com.carlos.tickets.ticket;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.carlos.tickets.common.security.UsuarioAutenticado;
import com.carlos.tickets.ticket.dto.TicketFiltro;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public final class TicketSpecifications {

	/** Acepta "TCK-000042", "tck-42" o "42". */
	private static final Pattern CODIGO = Pattern.compile("^(?:TCK-)?0*(\\d{1,18})$", Pattern.CASE_INSENSITIVE);

	private TicketSpecifications() {
	}

	/** Filtros del listado + alcance por rol (USUARIO solo ve los tickets que creó). */
	public static Specification<Ticket> filtrar(TicketFiltro filtro, UsuarioAutenticado usuario) {
		return (root, query, cb) -> {
			List<Predicate> predicados = new ArrayList<>();
			if (usuario.esUsuario()) {
				predicados.add(cb.equal(root.get("creador").get("id"), usuario.id()));
			}
			if (filtro.estado() != null) {
				predicados.add(cb.equal(root.get("estado"), filtro.estado()));
			}
			if (filtro.prioridad() != null) {
				predicados.add(cb.equal(root.get("prioridad"), filtro.prioridad()));
			}
			if (filtro.categoriaId() != null) {
				predicados.add(cb.equal(root.get("categoria").get("id"), filtro.categoriaId()));
			}
			if (filtro.asignadoId() != null) {
				predicados.add(cb.equal(root.get("asignado").get("id"), filtro.asignadoId()));
			}
			if (Boolean.TRUE.equals(filtro.sinAsignar())) {
				predicados.add(cb.isNull(root.get("asignado")));
			}
			if (StringUtils.hasText(filtro.q())) {
				String texto = filtro.q().trim();
				String like = "%" + texto.toLowerCase() + "%";
				Predicate coincidencia = cb.or(
						cb.like(cb.lower(root.<String>get("titulo")), like),
						cb.like(cb.lower(root.<String>get("descripcion")), like));
				Matcher codigo = CODIGO.matcher(texto);
				if (codigo.matches()) {
					coincidencia = cb.or(coincidencia, cb.equal(root.get("id"), Long.parseLong(codigo.group(1))));
				}
				predicados.add(coincidencia);
			}
			return cb.and(predicados.toArray(Predicate[]::new));
		};
	}

}
