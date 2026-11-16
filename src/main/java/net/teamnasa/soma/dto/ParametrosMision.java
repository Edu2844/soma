package net.teamnasa.soma.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public class ParametrosMision {
    @Positive
    private int duracionDias;
    @Positive private double limiteRadiacionMsv;
    @Positive private int fcMaxBpm;
    @Positive private int presionSistolicaMax;
    @Positive private double horasSuenoMin;
    @PositiveOrZero private double spo2MinPct;
    @PositiveOrZero private double temperaturaMaxC;
    @PositiveOrZero private double glucosaMinMgDl;
    @PositiveOrZero private double glucosaMaxMgDl;
}