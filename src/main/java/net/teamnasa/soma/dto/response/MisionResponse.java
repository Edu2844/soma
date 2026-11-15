package net.teamnasa.soma.dto.response;

import net.teamnasa.soma.models.embedded.CambioFase;
import net.teamnasa.soma.models.embedded.ParametrosMision;
import net.teamnasa.soma.models.enums.FaseMision;

import java.time.Instant;
import java.util.List;

public record MisionResponse(
        String id, String nombre, FaseMision fase,
        Instant fechaInicio, Instant fechaFinEstimada, Instant fechaFinReal,
        ParametrosMision parametros, List<CambioFase> historialFases) {}