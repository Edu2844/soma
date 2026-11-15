package net.teamnasa.soma.controllers.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import net.teamnasa.soma.dto.request.ActividadRequest;
import net.teamnasa.soma.dto.request.CambioEstadoActividadRequest;
import net.teamnasa.soma.dto.response.ActividadResponse;
import net.teamnasa.soma.mapper.ActividadMapper;
import net.teamnasa.soma.services.ActividadService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/actividades")
@RequiredArgsConstructor
public class ActividadController {
    private final ActividadService actividadService;
    private final ActividadMapper mapper;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ActividadResponse asignar(@Valid @RequestBody ActividadRequest r) {
        return mapper.toResponse(actividadService.asignar(mapper.toEntity(r)));
    }

    // GET /api/actividades/astronauta/AST-001?fecha=2026-11-15
    @GetMapping("/astronauta/{astronautaId}")
    public List<ActividadResponse> delDia(@PathVariable String astronautaId, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return actividadService.delDia(astronautaId, fecha).stream().map(mapper::toResponse).toList();
    }

    // GET /api/actividades/astronauta/AST-001/rango?desde=2026-11-01&hasta=2026-11-15
    @GetMapping("/astronauta/{astronautaId}/rango")
    public List<ActividadResponse> entre(@PathVariable String astronautaId, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return actividadService.entre(astronautaId, desde, hasta).stream().map(mapper::toResponse).toList();
    }

    @PatchMapping("/{id}/estado")
    public ActividadResponse cambiarEstado(@PathVariable String id, @Valid @RequestBody CambioEstadoActividadRequest r) {
        return mapper.toResponse(actividadService.cambiarEstado(id, r.estado()));
    }
}