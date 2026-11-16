package net.teamnasa.soma.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class PsicologiaSueno {
    @DecimalMin("0.0") @DecimalMax("24.0") private Double horasSueno;
    @Min(1) @Max(10) private Integer nivelEstres;
    @Min(1) @Max(10) private Integer fatigaMental;
    @Min(1) @Max(5) private Integer estadoAnimo;
}
