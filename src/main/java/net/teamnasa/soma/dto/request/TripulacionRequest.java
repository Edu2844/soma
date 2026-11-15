package net.teamnasa.soma.dto.request;

import jakarta.validation.constraints.NotBlank;

public record TripulacionRequest(
        @NotBlank String nombre,
        String misionId) {}