package net.teamnasa.soma.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class Cardiologia {
    @Min(20) @Max(250) private Integer fcReposoBpm;
    @Min(20) @Max(250) private Integer fcPromedioBpm;
    @Min(50) @Max(250) private Integer presionSistolica;
    @Min(30) @Max(150) private Integer presionDiastolica;
    @DecimalMin("50.0") @DecimalMax("100.0") private Double spo2Pct;
    @DecimalMin("30.0") @DecimalMax("45.0") private Double temperaturaC;
}