package net.teamnasa.soma.repositories;

import net.teamnasa.soma.models.Mensaje;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MensajeRepository extends MongoRepository<Mensaje, String> {
    List<Mensaje> findTop50ByAstronautaIdOrderByFechaDesc(String astronautaId);
    List<Mensaje> findByAstronautaIdAndLeidoFalse(String astronautaId);
    long countByAstronautaIdAndLeidoFalse(String astronautaId);
}
