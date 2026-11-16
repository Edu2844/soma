package net.teamnasa.soma.models.embedded;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Hematologia {
    private Double hemoglobinaGdl;
    private Double hematocritoPct;
    private Integer leucocitosUl;
    private Double cortisolSalivalNmolL;
    /** Glucosa en sangre (glucómetro), en mg/dL. */
    @DecimalMin("20.0") @DecimalMax("600.0")
    private Double glucosaMgDl;
}
