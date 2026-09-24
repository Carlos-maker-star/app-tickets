package com.carlos.tickets.comentario;

import java.time.Instant;

import com.carlos.tickets.ticket.Ticket;
import com.carlos.tickets.usuario.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "comentarios")
@Getter
@NoArgsConstructor
public class Comentario {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "ticket_id", nullable = false, updatable = false)
	private Ticket ticket;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "autor_id", nullable = false, updatable = false)
	private Usuario autor;

	@Column(nullable = false, columnDefinition = "text")
	private String contenido;

	/** Solo visible para TECNICO y ADMIN. */
	@Column(nullable = false)
	private boolean interno;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	public Comentario(Ticket ticket, Usuario autor, String contenido, boolean interno) {
		this.ticket = ticket;
		this.autor = autor;
		this.contenido = contenido;
		this.interno = interno;
	}

}
