package net.teamnasa.soma.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.teamnasa.soma.models.enums.EstadoAlerta;
import net.teamnasa.soma.models.enums.Severidad;
import net.teamnasa.soma.models.enums.TipoAlerta;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("alertas")
public class Alerta {
    @Id
    private String id;
    @Indexed
    private String astronautaId;
    private String misionId;
    private String metricaId;
    private TipoAlerta tipoAlerta;
    private Severidad severidad;
    private EstadoAlerta estado;
    private String mensaje;
    private Instant fecha;
    private Instant fechaAtencion;
    private String atendidaPor;
}
