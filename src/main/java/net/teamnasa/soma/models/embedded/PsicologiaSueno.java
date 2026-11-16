package net.teamnasa.soma.models.embedded;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PsicologiaSueno {
    private Double horasSueno;
    private Integer nivelEstres;
    private Integer fatigaMental;
    /** Estado de ánimo autoinformado: 1 = muy bajo, 5 = muy bueno. */
    @Min(1) @Max(5)
    private Integer estadoAnimo;
}