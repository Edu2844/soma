package net.teamnasa.soma.dto;

import jakarta.validation.constraints.*;

public class DatosGenerales {
    @NotBlank
    @Pattern(regexp = "^(A|B|AB|O)[+-]$") private String grupoSanguineo;
    @NotNull
    @Positive
    private Double pesoBaseKg;
    @NotNull @Min(30) @Max(120) private Integer fcReposoBaseBpm;
}