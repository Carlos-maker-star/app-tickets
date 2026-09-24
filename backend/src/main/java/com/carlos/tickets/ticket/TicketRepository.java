package com.carlos.tickets.ticket;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {

	@Override
	@EntityGraph(attributePaths = { "categoria", "creador", "asignado" })
	Page<Ticket> findAll(Specification<Ticket> spec, Pageable pageable);

	@Override
	@EntityGraph(attributePaths = { "categoria", "creador", "asignado" })
	Optional<Ticket> findById(Long id);

	// --- Dashboard: cada fila es [enum, count] ---

	@Query("select t.estado, count(t) from Ticket t group by t.estado")
	List<Object[]> contarPorEstado();

	@Query("select t.estado, count(t) from Ticket t where t.creador.id = :creadorId group by t.estado")
	List<Object[]> contarPorEstadoDeCreador(Long creadorId);

	@Query("select t.prioridad, count(t) from Ticket t group by t.prioridad")
	List<Object[]> contarPorPrioridad();

	@Query("select t.prioridad, count(t) from Ticket t where t.creador.id = :creadorId group by t.prioridad")
	List<Object[]> contarPorPrioridadDeCreador(Long creadorId);

	long countByAsignadoIsNullAndEstado(EstadoTicket estado);

	long countByAsignadoIdAndEstadoIn(Long asignadoId, Collection<EstadoTicket> estados);

}
