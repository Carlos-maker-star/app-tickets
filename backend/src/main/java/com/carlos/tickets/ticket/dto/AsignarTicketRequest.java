package com.carlos.tickets.ticket.dto;

import jakarta.validation.constraints.NotNull;

public record AsignarTicketRequest(@NotNull(message = "El técnico es obligatorio") Long tecnicoId) {
}
