package net.teamnasa.soma.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class Cardiologia {
    @Min(20) @Max(250) private Integer fcReposoBpm;
    @Min(20) @Max(250) private Integer fcPromedioBpm;
    @Min(50) @Max(250) private Integer presionSistolica;
    @Min(30) @Max(150) private Integer presionDiastolica;
}