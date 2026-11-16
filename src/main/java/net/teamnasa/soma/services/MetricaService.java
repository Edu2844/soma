package net.teamnasa.soma.services;

import lombok.RequiredArgsConstructor;
import net.teamnasa.soma.models.Astronauta;
import net.teamnasa.soma.models.Metrica;
import net.teamnasa.soma.models.Mision;
import net.teamnasa.soma.models.Tripulacion;
import net.teamnasa.soma.models.embedded.MetricasSalud;
import net.teamnasa.soma.models.embedded.Radiologia;
import net.teamnasa.soma.models.enums.FaseMision;
import net.teamnasa.soma.models.enums.Frecuencia;
import net.teamnasa.soma.repositories.MetricaRepository;
import net.teamnasa.soma.repositories.TripulacionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class MetricaService {
    private final MetricaRepository metricaRepository;
    private final AstronautaService astronautaService;
    private final TripulacionRepository tripulacionRepository;
    private final MisionService misionService;
    private final AlertaService alertaService;
    private final AccesoService acceso;

    public Metrica registrar(Metrica m) {

        acceso.exigirStaffOPropio(m.getAstronautaId());

        Astronauta astronauta = astronautaService.obtener(m.getAstronautaId());

        if (astronauta.getTripulacionId() == null) {
            throw new IllegalStateException("El astronauta no pertenece a ninguna tripulación");
        }
        Tripulacion trip = tripulacionRepository.findById(astronauta.getTripulacionId()).orElseThrow(() -> new NoSuchElementException("Tripulación no encontrada"));
        if (trip.getMisionId() == null) {
            throw new IllegalStateException("La tripulación no tiene misión asignada");
        }
        Mision mision = misionService.obtener(trip.getMisionId());
        if (mision.getFaseMision() == FaseMision.FINALIZADA || mision.getFaseMision() == FaseMision.ABORTADA) {
            throw new IllegalStateException("La misión ya terminó, no se registran métricas");
        }

        if (m.getFrecuencia() == null || m.getMetricasSalud() == null) {
            throw new IllegalArgumentException("Faltan frecuencia o métricas de salud");
        }

        if (m.getFrecuencia() == Frecuencia.PERIODICO && (m.getNombreProtocolo() == null || m.getNombreProtocolo().isBlank())) {
            throw new IllegalArgumentException("Un control PERIODICO necesita nombreProtocolo");
        }

        MetricasSalud s = m.getMetricasSalud();
        if (s.getCardiologia() == null && s.getPsicologiaSueno() == null
                && s.getRadiologia() == null
                && s.getMedicinaDeportiva() == null
                && s.getHematologia() == null) {

            throw new IllegalArgumentException("Debes enviar al menos un bloque de métricas");
        }

        if (m.getFecha() == null) {
            m.setFecha(Instant.now());
        }

        if (m.getFrecuencia() == Frecuencia.DIARIO) {
            Instant inicio = m.getFecha().atZone(ZoneOffset.UTC).toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant();
            if (metricaRepository.existeEnRango(m.getAstronautaId(), Frecuencia.DIARIO, inicio, inicio.plus(1, ChronoUnit.DAYS)))
                throw new IllegalStateException("Ya existe el control diario de ese día");
        }

        m.setId(null);
        m.setMisionId(mision.getId());
        Metrica guardada = metricaRepository.save(m);

        if (m.getFrecuencia() == Frecuencia.DIARIO) {
            Radiologia rad = m.getMetricasSalud().getRadiologia();
            double dosis = (rad != null && rad.getDosisDiariaMsv() != null) ? rad.getDosisDiariaMsv() : 0.0;
            astronautaService.sumarAcumulados(astronauta.getId(), 1, dosis);
        }

        Astronauta actualizado = astronautaService.obtener(astronauta.getId());
        alertaService.generarParaMetrica(guardada, mision.getParametrosMision(), actualizado);

        return guardada;
    }

    public Metrica obtener(String id) {
        Metrica m = metricaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Métrica no encontrada: " + id));
        acceso.exigirStaffOPropio(m.getAstronautaId());
        return m;
    }

    public Page<Metrica> historial(String astronautaId, Pageable pageable) {
        return metricaRepository.findByAstronautaIdOrderByFechaDesc(astronautaId, pageable);
    }

    public Metrica ultima(String astronautaId) {
        return metricaRepository.findFirstByAstronautaIdOrderByFechaDesc(astronautaId)
                .orElseThrow(() -> new NoSuchElementException("El astronauta no tiene métricas"));
    }

    public List<Metrica> entre(String astronautaId, Instant desde, Instant hasta) {
        return metricaRepository.buscarEnRango(astronautaId, desde, hasta, Sort.by("fecha").ascending());
    }
}
