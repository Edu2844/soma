package net.teamnasa.soma.dto.response;

import net.teamnasa.soma.models.enums.EstadoAlerta;
import net.teamnasa.soma.models.enums.Severidad;
import net.teamnasa.soma.models.enums.TipoAlerta;

import java.time.Instant;

public record AlertaResponse(
        String id, String astronautaId, String misionId, String metricaId,
        TipoAlerta tipo, Severidad severidad, EstadoAlerta estado,
        String mensaje, Instant fecha, Instant fechaAtencion, String atendidaPor) {}