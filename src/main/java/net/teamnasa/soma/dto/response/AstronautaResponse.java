package net.teamnasa.soma.dto.response;

import net.teamnasa.soma.models.embedded.Acumulados;
import net.teamnasa.soma.models.embedded.DatosGenerales;
import net.teamnasa.soma.models.enums.CargoMision;

public record AstronautaResponse(
        String id, String nombre, CargoMision cargo, String tripulacionId,
        DatosGenerales datosGenerales, Acumulados acumulados) {}