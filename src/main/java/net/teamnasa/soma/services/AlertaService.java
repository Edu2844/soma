package net.teamnasa.soma.services;

import lombok.RequiredArgsConstructor;
import net.teamnasa.soma.models.Alerta;
import net.teamnasa.soma.models.Astronauta;
import net.teamnasa.soma.models.Metrica;
import net.teamnasa.soma.models.embedded.ParametrosMision;
import net.teamnasa.soma.models.enums.EstadoAlerta;
import net.teamnasa.soma.repositories.AlertaRepository;
import net.teamnasa.soma.services.alertas.ReglaAlerta;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class AlertaService {
    private final AlertaRepository alertaRepository;
    private final List<ReglaAlerta> reglas;

    public List<Alerta> generarParaMetrica(Metrica m, ParametrosMision p, Astronauta a) {
        List<Alerta> nuevas = reglas.stream()
                .flatMap(r -> r.evaluar(m, p, a).stream())
                .toList();
        return alertaRepository.saveAll(nuevas);
    }

    public Page<Alerta> listarPorEstado(EstadoAlerta estado, Pageable pageable) {
        return alertaRepository.findByEstado(estado, pageable);
    }

    public Page<Alerta> listarPorAstronauta(String astronautaId, Pageable pageable) {
        return alertaRepository.findByAstronautaIdOrderByFechaDesc(astronautaId, pageable);
    }

    public Alerta reconocer(String id, String usuarioId) {
        return cambiar(id, EstadoAlerta.RECONOCIDA, usuarioId);
    }

    public Alerta resolver(String id, String usuarioId) {
        return cambiar(id, EstadoAlerta.RESUELTA, usuarioId);
    }

    /** Deshace un reconocimiento o una resolución: la alerta vuelve a ACTIVA. */
    public Alerta reactivar(String id) {
        Alerta a = alertaRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Alerta no encontrada: " + id));
        if (a.getEstado() == EstadoAlerta.ACTIVA) {
            throw new IllegalStateException("La alerta ya está activa");
        }
        a.setEstado(EstadoAlerta.ACTIVA);
        a.setAtendidaPor(null);
        a.setFechaAtencion(null);
        return alertaRepository.save(a);
    }

    private Alerta cambiar(String id, EstadoAlerta nuevo, String usuarioId) {
        Alerta a = alertaRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Alerta no encontrada: " + id));
        if (a.getEstado() == EstadoAlerta.RESUELTA) {
            throw new IllegalStateException("La alerta ya está resuelta");
        }
        a.setEstado(nuevo);
        a.setAtendidaPor(usuarioId);
        a.setFechaAtencion(Instant.now());
        return alertaRepository.save(a);
    }
}