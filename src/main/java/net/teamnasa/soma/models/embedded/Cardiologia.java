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
public class Cardiologia {
    private Integer fcReposoBpm;
    private Integer fcPromedioBpm;
    private Integer presionSistolica;
    private Integer presionDiastolica;
    /** Saturación de oxígeno en sangre (SpO2), en %. */
    @DecimalMin("50.0") @DecimalMax("100.0")
    private Double spo2Pct;
    /** Temperatura corporal, en °C. */
    @DecimalMin("30.0") @DecimalMax("45.0")
    private Double temperaturaC;
}
