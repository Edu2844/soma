package net.teamnasa.soma.dto;

import jakarta.validation.constraints.PositiveOrZero;

public class Radiologia {
    @PositiveOrZero
    private Double dosisDiariaMsv;
    @PositiveOrZero private Double tasaPicoUsvH;
}