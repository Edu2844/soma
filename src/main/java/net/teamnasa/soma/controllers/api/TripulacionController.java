package net.teamnasa.soma.controllers.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import net.teamnasa.soma.dto.request.TripulacionRequest;
import net.teamnasa.soma.dto.response.AstronautaResponse;
import net.teamnasa.soma.dto.response.TripulacionResponse;
import net.teamnasa.soma.mapper.AstronautaMapper;
import net.teamnasa.soma.mapper.TripulacionMapper;
import net.teamnasa.soma.services.AstronautaService;
import net.teamnasa.soma.services.TripulacionService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tripulaciones")
@RequiredArgsConstructor
public class TripulacionController {
    private final TripulacionService tripulacionService;
    private final AstronautaService astronautaService;
    private final TripulacionMapper mapper;
    private final AstronautaMapper astronautaMapper;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TripulacionResponse crear(@Valid @RequestBody TripulacionRequest r) {
        return mapper.toResponse(tripulacionService.crear(r.nombre(), r.misionId()));
    }

    @GetMapping
    public List<TripulacionResponse> listar() {
        return tripulacionService.listar().stream().map(mapper::toResponse).toList();
    }

    @GetMapping("/{id}")
    public TripulacionResponse obtener(@PathVariable String id) {
        return mapper.toResponse(tripulacionService.obtener(id));
    }

    @GetMapping("/{id}/astronautas")
    public List<AstronautaResponse> miembros(@PathVariable String id) {
        return astronautaService.listarPorTripulacion(id).stream().map(astronautaMapper::toResponse).toList();
    }

    @PostMapping("/{id}/astronautas/{astronautaId}")
    public TripulacionResponse agregar(@PathVariable String id, @PathVariable String astronautaId) {
        return mapper.toResponse(tripulacionService.agregarAstronauta(id, astronautaId));
    }

    @DeleteMapping("/{id}/astronautas/{astronautaId}")
    public TripulacionResponse quitar(@PathVariable String id, @PathVariable String astronautaId) {
        return mapper.toResponse(tripulacionService.quitarAstronauta(id, astronautaId));
    }

    @PutMapping("/{id}/comandante/{astronautaId}")
    public TripulacionResponse asignarComandante(@PathVariable String id, @PathVariable String astronautaId) {
        return mapper.toResponse(tripulacionService.asignarComandante(id, astronautaId));
    }
}