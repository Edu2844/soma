package net.teamnasa.soma.repositories;

import net.teamnasa.soma.models.Metrica;
import net.teamnasa.soma.models.enums.Frecuencia;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.awt.print.Pageable;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface MetricaRepository extends MongoRepository<Metrica, String> {

    Page<Metrica> findByAstronautaIdOrderByFechaDesc(String astronautaId, Pageable pageable);

    Optional<Metrica> findFirstByAstronautaIdOrderByFechaDesc(String astronautaId);

    @Query("{ 'astronautaId': ?0, 'fecha': { $gte: ?1, $lt: ?2 } }")
    List<Metrica> buscarEnRango(String astronautaId, Instant desde, Instant hasta, Sort sort);

    @Query(value = "{ 'astronautaId': ?0, 'frecuencia': ?1, 'fecha': { $gte: ?2, $lt: ?3 } }", exists = true)
    boolean existeEnRango(String astronautaId, Frecuencia frecuencia, Instant desde, Instant hasta);
}