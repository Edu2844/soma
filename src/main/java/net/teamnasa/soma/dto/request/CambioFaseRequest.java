package net.teamnasa.soma.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import net.teamnasa.soma.models.enums.FaseMision;

public record CambioFaseRequest(
        @NotNull FaseMision nuevaFase,
        @NotBlank String motivo) {}