package net.teamnasa.soma.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import net.teamnasa.soma.models.enums.EstadoActividad;
import net.teamnasa.soma.models.enums.TipoActividad;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("actividades")
public class Actividad {
    @Id
    private String id;
    @Indexed
    private String astronautaId;
    private String nombre;
    private String descripcion;
    private TipoActividad tipoActividad;
    private LocalDate fecha;
    private Integer duracionMin;
    private EstadoActividad estadoActividad;
}


