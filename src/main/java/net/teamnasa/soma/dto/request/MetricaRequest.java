package net.teamnasa.soma.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import net.teamnasa.soma.models.embedded.MetricasSalud;
import net.teamnasa.soma.models.enums.Frecuencia;

import java.time.Instant;

public record MetricaRequest(
        @NotBlank String astronautaId,
        Instant fecha,
        @NotNull Frecuencia frecuencia,
        String nombreProtocolo,
        @Valid @NotNull MetricasSalud metricasSalud,
        @Size(max = 1000) String notas) {}