package net.teamnasa.soma.mapper;

import net.teamnasa.soma.dto.request.MetricaRequest;
import net.teamnasa.soma.dto.response.MetricaResponse;
import net.teamnasa.soma.models.Metrica;
import org.springframework.stereotype.Component;

@Component
public class MetricaMapper {

    public Metrica toEntity(MetricaRequest r) {
        return Metrica.builder()
                .astronautaId(r.astronautaId())
                .fecha(r.fecha())
                .frecuencia(r.frecuencia())
                .nombreProtocolo(r.nombreProtocolo())
                .metricasSalud(r.metricasSalud())
                .notas(r.notas())
                .build();
    }

    public MetricaResponse toResponse(Metrica m) {
        return new MetricaResponse(m.getId(),
                m.getAstronautaId(),
                m.getMisionId(),
                m.getFecha(),
                m.getFrecuencia(),
                m.getNombreProtocolo(),
                m.getMetricasSalud(),
                m.getNotas()
        );
    }
}