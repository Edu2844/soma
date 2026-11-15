package net.teamnasa.soma.repositories;

import net.teamnasa.soma.models.Actividad;
import net.teamnasa.soma.models.enums.EstadoActividad;
import net.teamnasa.soma.models.enums.TipoActividad;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ActividadRepository extends MongoRepository<Actividad, String> {

    List<Actividad> findByAstronautIdAndFecha(String astronautaId, LocalDate fecha);

    List<Actividad> findByAstronautIdAndFechaBetweenOrderByFecha(String astronautaId, LocalDate desde, LocalDate hasta);

    List<Actividad> findByAstronautIdAndEstado(String astronautaId, EstadoActividad estado);

    List<Actividad> findByAstronautIdAndTipo(String astronautaId, TipoActividad actividad);

}
