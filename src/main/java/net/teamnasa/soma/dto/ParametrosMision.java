package net.teamnasa.soma.dto;

import jakarta.validation.constraints.Positive;

public class ParametrosMision {
    @Positive
    private int duracionDias;
    @Positive private double limiteRadiacionMsv;
    @Positive private int fcMaxBpm;
    @Positive private int presionSistolicaMax;
    @Positive private double horasSuenoMin;
}