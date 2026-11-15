package net.teamnasa.soma.mapper;

import net.teamnasa.soma.dto.response.AlertaResponse;
import net.teamnasa.soma.models.Alerta;
import org.springframework.stereotype.Component;

@Component
public class AlertaMapper {

    public AlertaResponse toResponse(Alerta a) {
        return new AlertaResponse(a.getId(),
                a.getAstronautaId(),
                a.getMisionId(),
                a.getMetricaId(),
                a.getTipoAlerta(),
                a.getSeveridad(),
                a.getEstado(),
                a.getMensaje(),
                a.getFecha(),
                a.getFechaAtencion(),
                a.getAtendidaPor()
        );
    }
}