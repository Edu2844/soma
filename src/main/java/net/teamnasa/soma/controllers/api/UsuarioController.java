package net.teamnasa.soma.controllers.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import net.teamnasa.soma.dto.request.CambioPasswordRequest;
import net.teamnasa.soma.dto.request.UsuarioRequest;
import net.teamnasa.soma.dto.response.UsuarioResponse;
import net.teamnasa.soma.mapper.UsuarioMapper;
import net.teamnasa.soma.services.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {
    private final UsuarioService usuarioService;
    private final UsuarioMapper mapper;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse crear(@Valid @RequestBody UsuarioRequest r) {
        return mapper.toResponse(usuarioService.crear(r.codigo(), r.password(), r.rol(), r.astronautaId()));
    }

    @GetMapping
    public List<UsuarioResponse> listar() {
        return usuarioService.listar().stream().map(mapper::toResponse).toList();
    }

    @GetMapping("/{id}")
    public UsuarioResponse obtener(@PathVariable String id) {
        return mapper.toResponse(usuarioService.obtener(id));
    }

    @PatchMapping("/{id}/password")
    public UsuarioResponse cambiarPassword(@PathVariable String id, @Valid @RequestBody CambioPasswordRequest r) {
        return mapper.toResponse(usuarioService.cambiarPassword(id, r.nuevaPassword()));
    }

    @PatchMapping("/{id}/estado")
    public UsuarioResponse cambiarEstado(@PathVariable String id, @RequestParam boolean activo) {
        return mapper.toResponse(usuarioService.cambiarEstado(id, activo));
    }
}