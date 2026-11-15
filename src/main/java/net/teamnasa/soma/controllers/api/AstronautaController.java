package net.teamnasa.soma.controllers.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import net.teamnasa.soma.dto.request.AstronautaRequest;
import net.teamnasa.soma.dto.response.AstronautaResponse;
import net.teamnasa.soma.mapper.AstronautaMapper;
import net.teamnasa.soma.services.AstronautaService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/astronautas")
@RequiredArgsConstructor
public class AstronautaController {
    private final AstronautaService astronautaService;
    private final AstronautaMapper mapper;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AstronautaResponse crear(@Valid @RequestBody AstronautaRequest r) {
        return mapper.toResponse(astronautaService.crear(mapper.toEntity(r)));
    }

    @GetMapping
    public List<AstronautaResponse> listar() {
        return astronautaService.listar().stream().map(mapper::toResponse).toList();
    }

    @GetMapping("/{id}")
    public AstronautaResponse obtener(@PathVariable String id) {
        return mapper.toResponse(astronautaService.obtener(id));
    }

    @PutMapping("/{id}")
    public AstronautaResponse actualizar(@PathVariable String id, @Valid @RequestBody AstronautaRequest r) {
        return mapper.toResponse(astronautaService.actualizar(id, mapper.toEntity(r)));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable String id) {
        astronautaService.eliminar(id);
    }
}