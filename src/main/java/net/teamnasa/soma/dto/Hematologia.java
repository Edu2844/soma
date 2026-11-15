package net.teamnasa.soma.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public class Hematologia {
    @Positive
    private Double hemoglobinaGdl;
    @DecimalMin("0.0") @DecimalMax("100.0") private Double hematocritoPct;
    @Positive private Integer leucocitosUl;
    @PositiveOrZero
    private Double cortisolSalivalNmolL;
}