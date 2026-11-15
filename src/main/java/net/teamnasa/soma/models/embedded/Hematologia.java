package net.teamnasa.soma.models.embedded;

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
}
