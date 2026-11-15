package net.teamnasa.soma.services;

import lombok.RequiredArgsConstructor;
import net.teamnasa.soma.models.Astronauta;
import net.teamnasa.soma.models.embedded.Acumulados;
import net.teamnasa.soma.models.embedded.DatosGenerales;
import net.teamnasa.soma.repositories.AstronautaRepository;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class AstronautaService {
    private final AstronautaRepository astronautaRepository;
    private final MongoTemplate mongoTemplate;

    public Astronauta crear(Astronauta a){
        a.setId(null);
        a.setTripulacionId(null);
        a.setAcumulados(new Acumulados(0, 0.0));
        return astronautaRepository.save(a);
    }

    public List<Astronauta> listar() {
        return astronautaRepository.findAll();
    }

    public List<Astronauta> listarPorTripulacion(String tripulacionId) {
       return astronautaRepository.findByTripulationId(tripulacionId);
    }

    public Astronauta obtener(String id) {
        return astronautaRepository.findById(id).orElseThrow(()-> new NoSuchElementException("Astronauta no encontrado" + id));
    }

    public Astronauta actualizar(String id, Astronauta datos){
        Astronauta a = obtener(id);
        a.setNombre(datos.getNombre());
        a.setCargo(datos.getCargo());
        a.setDatosGenerales(new DatosGenerales());
        return astronautaRepository.save(a);
    }

    public void eliminar(String id) {
        obtener(id);
        astronautaRepository.deleteById(id);
    }

    public void sumarAcumulados(String id, int dias, double radiacionMsv) {
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(id)),
                new Update()
                        .inc("acumulados.diasEnOrbita", dias)
                        .inc("acumulados.radiacionAcumuladaMsv", radiacionMsv),
                Astronauta.class);
    }
}
