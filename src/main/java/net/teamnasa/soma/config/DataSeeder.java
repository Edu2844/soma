package net.teamnasa.soma.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.teamnasa.soma.models.*;
import net.teamnasa.soma.models.embedded.*;
import net.teamnasa.soma.models.enums.*;
import net.teamnasa.soma.repositories.UsuarioRepository;
import net.teamnasa.soma.services.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Random;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    /** Último día con métricas y alertas de demo. */
    private static final LocalDate ULTIMO_DIA = LocalDate.of(2026, 11, 14);

    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;
    private final MisionService misionService;
    private final TripulacionService tripulacionService;
    private final AstronautaService astronautaService;
    private final ActividadService actividadService;
    private final MetricaService metricaService;
    private final MensajeService mensajeService;

    @Override
    public void run(String... args) {
        if (usuarioRepository.count() > 0) {
            log.info("DataSeeder: ya hay datos, no se carga nada");
            return;
        }

        // 1. Usuarios del sistema
        Usuario admin = usuarioService.crear("admin", "admin1234", RolUsuario.ADMIN, null);
        // El médico es un tripulante a bordo (oficial médico): se crea más abajo junto a su astronauta

        // 2. Misión (queda EN_CURSO)
        Mision mision = misionService.crear(Mision.builder()
                .nombre("Misión Soma I")
                .fechaInicio(Instant.now().minus(30, ChronoUnit.DAYS))
                .fechaEstimada(Instant.now().plus(150, ChronoUnit.DAYS))
                .parametrosMision(ParametrosMision.builder()
                        .duracionDias(180)
                        .limiteRadiacionMsv(600.0)
                        .fcMaxBpm(100)
                        .presionSistolicaMax(130)
                        .horasSuenoMin(6.5)
                        .spo2MinPct(95.0)
                        .temperaturaMaxC(37.5)
                        .glucosaMinMgDl(70.0)
                        .glucosaMaxMgDl(180.0)
                        .build())
                .build());
        misionService.cambiarFase(mision.getId(), FaseMision.EN_CURSO, "Lanzamiento", admin.getId());

        // 3. Tripulación
        Tripulacion trip = tripulacionService.crear("Tripulación Alfa", mision.getId());

        // 4. Astronautas (+ usuario de cada uno)
        Astronauta elena = crearAstronauta("Dra. Elena Vance", CargoMision.COMANDANTE, "O+", 64.5, 58, "elena.vance");
        Astronauta marco = crearAstronauta("Marco Ruiz", CargoMision.PILOTO, "A+", 78.0, 62, "marco.ruiz");
        Astronauta aiko  = crearAstronauta("Aiko Tanaka", CargoMision.INGENIERO_VUELO, "B-", 58.2, 60, "aiko.tanaka");
        Astronauta tomas = crearAstronauta("Dr. Tomás Reyes", CargoMision.OFICIAL_MEDICO, "AB+", 72.0, 60,
                "medico01", "medico1234", RolUsuario.MEDICO);
        Usuario medico = usuarioRepository.findByCodigo("medico01").orElseThrow();

        for (Astronauta a : List.of(elena, marco, aiko, tomas)) {
            tripulacionService.agregarAstronauta(trip.getId(), a.getId());
        }
        tripulacionService.asignarComandante(trip.getId(), elena.getId());

        // 5. Métricas diarias: 7 días que terminan en ULTIMO_DIA (un registro por astronauta y día)
        Random rnd = new Random(42);
        List<Astronauta> equipo = List.of(elena, marco, aiko, tomas);
        Instant hoy = ULTIMO_DIA.atStartOfDay(ZoneOffset.UTC).toInstant();

        for (int i = 0; i < equipo.size(); i++) {
            for (int d = 6; d >= 0; d--) {
                Instant fecha = hoy.minus(d, ChronoUnit.DAYS).plus(22, ChronoUnit.HOURS);

                // Valores normales
                int fcReposo = 58 + rnd.nextInt(6);
                int fcPromedio = 64 + rnd.nextInt(10);
                int sistolica = 112 + rnd.nextInt(12);
                int diastolica = 72 + rnd.nextInt(8);
                double spo2 = 97.0 + (d % 3) * 0.5;
                double temperatura = 36.5 + (d % 3) * 0.1;
                double horasSueno = 7.0 + rnd.nextInt(2) * 0.5;
                int estres = 2 + rnd.nextInt(3);
                int fatiga = 1 + rnd.nextInt(3);
                int animo = 4;
                double dosis = 0.4 + rnd.nextInt(20) / 100.0;
                double tasaPico = 18.0 + rnd.nextInt(10);
                int minCardio = 55 + rnd.nextInt(10);
                int minFuerza = 60 + rnd.nextInt(10);
                double glucosa = 92.0 + d;

                // Días con lecturas fuera de rango (d = 0 es ULTIMO_DIA)
                if (i == 1 && d <= 1) {            // Marco: últimos 2 días con problemas
                    fcPromedio = 108; sistolica = 138; spo2 = 93.5; temperatura = 37.9;
                    horasSueno = 4.5; estres = 9; fatiga = 8; animo = 2; minCardio = 20; glucosa = 192.0;
                } else if (i == 1 && d == 4) {     // Marco: mala noche
                    horasSueno = 5.5; estres = 7; fatiga = 6; animo = 3;
                } else if (i == 0 && d == 2) {     // Elena: fiebre
                    fcPromedio = 102; temperatura = 38.6; spo2 = 94.0; fatiga = 7; animo = 3;
                } else if (i == 2 && d == 0) {     // Aiko: insomnio y estrés
                    horasSueno = 4.8; estres = 8; fatiga = 7; animo = 2;
                } else if (i == 2 && d == 3) {     // Aiko: glucosa baja
                    glucosa = 62.0; fatiga = 5;
                } else if (i == 3 && d == 1) {     // Tomás: presión alta
                    sistolica = 142; diastolica = 88; estres = 6;
                } else if (i == 3 && d == 5) {     // Tomás: poco ejercicio
                    minCardio = 15; minFuerza = 20;
                }

                metricaService.registrar(Metrica.builder()
                        .astronautaId(equipo.get(i).getId())
                        .fecha(fecha)
                        .frecuencia(Frecuencia.DIARIO)
                        .metricasSalud(MetricasSalud.builder()
                                .cardiologia(Cardiologia.builder()
                                        .fcReposoBpm(fcReposo)
                                        .fcPromedioBpm(fcPromedio)
                                        .presionSistolica(sistolica)
                                        .presionDiastolica(diastolica)
                                        .spo2Pct(spo2)
                                        .temperaturaC(temperatura)
                                        .build())
                                .psicologiaSueno(PsicologiaSueno.builder()
                                        .horasSueno(horasSueno)
                                        .nivelEstres(estres)
                                        .fatigaMental(fatiga)
                                        .estadoAnimo(animo)
                                        .build())
                                .radiologia(Radiologia.builder()
                                        .dosisDiariaMsv(dosis)
                                        .tasaPicoUsvH(tasaPico)
                                        .build())
                                .medicinaDeportiva(MedicinaDeportiva.builder()
                                        .minCardio(minCardio)
                                        .minFuerzaAred(minFuerza)
                                        .build())
                                .hematologia(Hematologia.builder()
                                        .glucosaMgDl(glucosa)
                                        .build())
                                .build())
                        .build());
            }
        }

        // 6. Un examen periódico con hemoglobina baja (genera alerta PRECAUCION)
        metricaService.registrar(Metrica.builder()
                .astronautaId(elena.getId())
                .fecha(hoy.minus(1, ChronoUnit.DAYS).plus(10, ChronoUnit.HOURS).plus(30, ChronoUnit.MINUTES))
                .frecuencia(Frecuencia.PERIODICO)
                .nombreProtocolo("Panel Hematológico Mensual")
                .metricasSalud(MetricasSalud.builder()
                        .hematologia(Hematologia.builder()
                                .hemoglobinaGdl(11.2)
                                .hematocritoPct(36.5)
                                .leucocitosUl(5400)
                                .cortisolSalivalNmolL(18.2)
                                .build())
                        .build())
                .build());

        // 7. Actividades de hoy
        LocalDate fechaHoy = LocalDate.now(ZoneOffset.UTC);
        for (Astronauta a : equipo) {
            actividadService.asignar(actividad(a, "Cardio en cinta", TipoActividad.CARDIO, fechaHoy, 60));
            actividadService.asignar(actividad(a, "Entrenamiento ARED", TipoActividad.FUERZA, fechaHoy, 65));
            Actividad hidratacion = actividadService.asignar(
                    actividad(a, "Control de hidratación", TipoActividad.HIDRATACION, fechaHoy, 10));
            actividadService.cambiarEstado(hidratacion.getId(), EstadoActividad.COMPLETADA);
        }

        // 8. Mensaje de ejemplo: el oficial médico llama a revisión a Marco
        mensajeService.enviar(marco.getId(),
                "Please come to the medical bay today for a review of your sleep and blood pressure readings.",
                PrioridadMensaje.URGENTE, medico.getId());

        log.info("DataSeeder: datos de prueba cargados");
        log.info("  admin  -> codigo=admin / admin1234 / id={}", admin.getId());
        log.info("  medico -> codigo=medico01 / medico1234 / id={}", medico.getId());
        log.info("  astronautas -> astro1234 / ids: {}, {}, {}", elena.getId(), marco.getId(), aiko.getId());
        log.info("  oficial medico a bordo -> {} / astronautaId={}", tomas.getNombre(), tomas.getId());
    }

    private Astronauta crearAstronauta(String nombre, CargoMision cargo, String sangre,
                                       double peso, int fcBase, String codigoUsuario) {
        return crearAstronauta(nombre, cargo, sangre, peso, fcBase, codigoUsuario, "astro1234", RolUsuario.TRIPULANTE);
    }

    private Astronauta crearAstronauta(String nombre, CargoMision cargo, String sangre, double peso, int fcBase,
                                       String codigoUsuario, String password, RolUsuario rol) {
        Astronauta a = astronautaService.crear(Astronauta.builder()
                .nombre(nombre)
                .cargo(cargo)
                .datosGenerales(DatosGenerales.builder()
                        .grupoSanguineo(sangre).pesoBaseKg(peso).fcReposoBaseBpm(fcBase).build())
                .build());
        usuarioService.crear(codigoUsuario, password, rol, a.getId());
        return a;
    }

    private Actividad actividad(Astronauta a, String nombre, TipoActividad tipo, LocalDate fecha, int min) {
        return Actividad.builder().astronautaId(a.getId()).nombre(nombre).tipoActividad(tipo).fecha(fecha).duracionMin(min).build();
    }
}