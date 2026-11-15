package net.teamnasa.soma.dto;

import jakarta.validation.Valid;

public class MetricasSalud {
    @Valid private Cardiologia cardiologia;
    @Valid
    private PsicologiaSueno psicologiaSueno;
    @Valid private Radiologia radiologia;
    @Valid private MedicinaDeportiva medicinaDeportiva;
    @Valid private Hematologia hematologia;
}