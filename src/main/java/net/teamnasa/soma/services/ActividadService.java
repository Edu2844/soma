package net.teamnasa.soma.services;

import lombok.RequiredArgsConstructor;
import net.teamnasa.soma.models.Actividad;
import net.teamnasa.soma.models.enums.EstadoActividad;
import net.teamnasa.soma.repositories.ActividadRepository;
import net.teamnasa.soma.repositories.AstronautaRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class ActividadService {
    private final ActividadRepository actividadRepository;
    private final AstronautaRepository astronautaRepository;
    private final AccesoService acceso;

    public Actividad asignar(Actividad a) {
        if (!astronautaRepository.existsById(a.getAstronautaId())) {
            throw new NoSuchElementException("Astronauta no encontrado: " + a.getAstronautaId());
        }
        a.setId(null);
        a.setEstadoActividad(EstadoActividad.PENDIENTE);
        return actividadRepository.save(a);
    }

    public List<Actividad> delDia(String astronautaId, LocalDate fecha) {
        return actividadRepository.findByAstronautaIdAndFecha(astronautaId, fecha);
    }

    public List<Actividad> entre(String astronautaId, LocalDate desde, LocalDate hasta) {
        return actividadRepository.findByAstronautaIdAndFechaBetweenOrderByFecha(astronautaId, desde, hasta);
    }

    public Actividad cambiarEstado(String id, EstadoActividad estado) {
        Actividad a = actividadRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Actividad no encontrada: " + id));
        // El tripulante solo marca sus propias actividades
        acceso.exigirStaffOPropio(a.getAstronautaId());
        a.setEstadoActividad(estado);
        return actividadRepository.save(a);
    }
}