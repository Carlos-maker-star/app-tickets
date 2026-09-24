package com.carlos.tickets.historial;

import java.time.Instant;

import com.carlos.tickets.ticket.Ticket;
import com.carlos.tickets.usuario.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

/** Registro inmutable de un cambio en un ticket. */
@Entity
@Table(name = "historial_tickets")
@Getter
@NoArgsConstructor
public class HistorialTicket {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "ticket_id", nullable = false, updatable = false)
	private Ticket ticket;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "usuario_id", nullable = false, updatable = false)
	private Usuario usuario;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20, updatable = false)
	private AccionHistorial accion;

	@Column(length = 255, updatable = false)
	private String valorAnterior;

	@Column(length = 255, updatable = false)
	private String valorNuevo;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	public HistorialTicket(Ticket ticket, Usuario usuario, AccionHistorial accion, String valorAnterior,
			String valorNuevo) {
		this.ticket = ticket;
		this.usuario = usuario;
		this.accion = accion;
		this.valorAnterior = valorAnterior;
		this.valorNuevo = valorNuevo;
	}

}
