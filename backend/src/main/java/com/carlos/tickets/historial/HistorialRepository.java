package com.carlos.tickets.historial;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HistorialRepository extends JpaRepository<HistorialTicket, Long> {

	@EntityGraph(attributePaths = "usuario")
	List<HistorialTicket> findByTicketIdOrderByCreatedAtAscIdAsc(Long ticketId);

}
