package net.teamnasa.soma.dto.request;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank String codigo,
        @NotBlank String password) {
}