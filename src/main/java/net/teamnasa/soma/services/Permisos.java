package net.teamnasa.soma.services;

import lombok.experimental.UtilityClass;

@UtilityClass
public class Permisos {

    public final String ADMIN = "hasRole('ADMIN')";
    public final String STAFF = "hasAnyRole('ADMIN','MEDICO')";
    public final String STAFF_O_PROPIO = "hasAnyRole('ADMIN','MEDICO') or @acceso.esPropio(authentication, #astronautaId)";
    public final String STAFF_O_PROPIO_ID = "hasAnyRole('ADMIN','MEDICO') or @acceso.esPropio(authentication, #id)";
}