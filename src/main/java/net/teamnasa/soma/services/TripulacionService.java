package net.teamnasa.soma.services;

import lombok.RequiredArgsConstructor;
import net.teamnasa.soma.models.Astronauta;
import net.teamnasa.soma.models.Tripulacion;
import net.teamnasa.soma.repositories.AstronautaRepository;
import net.teamnasa.soma.repositories.MisionRepository;
import net.teamnasa.soma.repositories.TripulacionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class TripulacionService {
    private final TripulacionRepository tripulacionRepository;
    private final AstronautaRepository astronautaRepository;
    private final MisionRepository misionRepository;

    public Tripulacion crear(String nombre, String misionId) {
        if (misionId != null) {
            if (!misionRepository.existsById(misionId)) {
                throw new NoSuchElementException("Misión no encontrada: " + misionId);
            }

            if (tripulacionRepository.findByMisionId(misionId).isPresent()) {
                throw new IllegalStateException("Esa misión ya tiene tripulación");
            }
        }
        return tripulacionRepository.save(Tripulacion.builder().nombre(nombre).misionId(misionId).build());
    }

    public List<Tripulacion> listar() {
        return tripulacionRepository.findAll();
    }

    public Tripulacion obtener(String id) {
        return tripulacionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Tripulación no encontrada: " + id));
    }

    public Tripulacion agregarAstronauta(String tripulacionId, String astronautaId) {
        Tripulacion t = obtener(tripulacionId);
        Astronauta a = astronautaRepository.findById(astronautaId)
                .orElseThrow(() -> new NoSuchElementException("Astronauta no encontrado: " + astronautaId));

        if (a.getTripulacionId() != null) {
            throw new IllegalStateException("El astronauta ya pertenece a una tripulación");
        }

        t.getAstronautasIds().add(astronautaId);
        a.setTripulacionId(tripulacionId);
        astronautaRepository.save(a);
        return tripulacionRepository.save(t);
    }

    public Tripulacion quitarAstronauta(String tripulacionId, String astronautaId) {
        Tripulacion t = obtener(tripulacionId);
        if (!t.getAstronautasIds().remove(astronautaId)) {
            throw new IllegalStateException("El astronauta no pertenece a esta tripulación");
        }
        if (astronautaId.equals(t.getComandanteId())) {
            t.setComandanteId(null);
        }

        astronautaRepository.findById(astronautaId).ifPresent(a -> {
            a.setTripulacionId(null);
            astronautaRepository.save(a);
        });
        return tripulacionRepository.save(t);
    }

    public Tripulacion asignarComandante(String tripulacionId, String astronautaId) {
        Tripulacion t = obtener(tripulacionId);
        if (!t.getAstronautasIds().contains(astronautaId)) {
            throw new IllegalStateException("El comandante debe ser miembro de la tripulación");
        }
        t.setComandanteId(astronautaId);
        return tripulacionRepository.save(t);
    }
}