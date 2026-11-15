package net.teamnasa.soma.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CambioPasswordRequest(
        @NotBlank @Size(min = 8, max = 64) String nuevaPassword) {}