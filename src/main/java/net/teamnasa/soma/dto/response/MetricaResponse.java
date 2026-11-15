package net.teamnasa.soma.dto.response;

import net.teamnasa.soma.models.embedded.MetricasSalud;
import net.teamnasa.soma.models.enums.Frecuencia;

import java.time.Instant;

public record MetricaResponse(
        String id, String astronautaId, String misionId, Instant fecha,
        Frecuencia frecuencia, String nombreProtocolo, MetricasSalud metricasSalud) {}
