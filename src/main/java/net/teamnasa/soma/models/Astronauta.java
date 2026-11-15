package net.teamnasa.soma.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.teamnasa.soma.models.embedded.Acumulados;
import net.teamnasa.soma.models.embedded.DatosGenerales;
import net.teamnasa.soma.models.enums.CargoMision;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("astronautas")
public class Astronauta {
    @Id
    private String id;
    private String nombre;
    private CargoMision cargo;
    private String tripulacionId;
    private DatosGenerales datosGenerales;
    private Acumulados acumulados;
}
