package net.teamnasa.soma.models.embedded;

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
}
