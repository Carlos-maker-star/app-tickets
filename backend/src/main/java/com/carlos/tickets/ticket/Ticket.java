package com.carlos.tickets.ticket;

import java.time.Instant;

import com.carlos.tickets.categoria.Categoria;
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
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
public class Ticket {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 150)
	private String titulo;

	@Column(nullable = false, columnDefinition = "text")
	private String descripcion;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private EstadoTicket estado = EstadoTicket.ABIERTO;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private Prioridad prioridad = Prioridad.MEDIA;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "categoria_id", nullable = false)
	private Categoria categoria;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "creador_id", nullable = false, updatable = false)
	private Usuario creador;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "asignado_id")
	private Usuario asignado;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(nullable = false)
	private Instant updatedAt;

	private Instant resueltoAt;

	private Instant cerradoAt;

	/** Código legible derivado del id, p. ej. {@code TCK-000042}. No se persiste. */
	public String getCodigo() {
		return id == null ? null : "TCK-%06d".formatted(id);
	}

	/** Cambia el estado y mantiene las fechas de resolución/cierre. No valida permisos: ver {@link TransicionEstado}. */
	public void cambiarEstado(EstadoTicket nuevo) {
		switch (nuevo) {
			case RESUELTO -> resueltoAt = Instant.now();
			case CERRADO -> cerradoAt = Instant.now();
			case ABIERTO -> resueltoAt = null;
			default -> {
			}
		}
		this.estado = nuevo;
	}

}
