package com.carlos.tickets.comentario;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComentarioRepository extends JpaRepository<Comentario, Long> {

	@EntityGraph(attributePaths = "autor")
	List<Comentario> findByTicketIdOrderByCreatedAtAsc(Long ticketId);

	@EntityGraph(attributePaths = "autor")
	List<Comentario> findByTicketIdAndInternoFalseOrderByCreatedAtAsc(Long ticketId);

}
