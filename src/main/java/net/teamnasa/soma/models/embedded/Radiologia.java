package net.teamnasa.soma.models.embedded;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Radiologia {
    private Double dosisDiariaMsv;
    private Double tasaPicoUsvH;
}
