package net.teamnasa.soma.dto;

import jakarta.validation.constraints.PositiveOrZero;

public class MedicinaDeportiva {
    @PositiveOrZero
    private Integer minCardio;
    @PositiveOrZero private Integer minFuerzaAred;
}