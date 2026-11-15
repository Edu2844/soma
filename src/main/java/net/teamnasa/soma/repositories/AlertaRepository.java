package net.teamnasa.soma.repositories;

import net.teamnasa.soma.models.Alerta;
import net.teamnasa.soma.models.enums.EstadoAlerta;
import net.teamnasa.soma.models.enums.Severidad;
import net.teamnasa.soma.models.enums.TipoAlerta;
import org.springframework.data.domain.Page;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.awt.print.Pageable;
import java.util.List;

@Repository
public interface AlertaRepository extends MongoRepository<Alerta,String> {

    Page<Alerta> findByEstado(EstadoAlerta estado, Pageable pagina);

    Page<Alerta> findByTipo(TipoAlerta tipo, Pageable pagina);

    Page<Alerta> findBySeveridad(Severidad severidad, Pageable pagina);

    Page<Alerta> findByAstronautaIdOrderByFechaDesc(String astronautaId, Pageable pageable);

    List<Alerta> findByAstronautaIdAndEstado(String astronautaId, EstadoAlerta estado);

    long countByEstadoAndSeveridad(EstadoAlerta estado, Severidad severidad);
}
