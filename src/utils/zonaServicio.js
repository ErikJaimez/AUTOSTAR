/**
 * Validación de zona de servicio para AUTOSTAR
 * Zona sur de la Ciudad de México: Tlalpan, Coyoacán, Xochimilco, Tláhuac, Milpa Alta
 */

/**
 * Rangos de códigos postales por alcaldía de la zona sur de CDMX
 */
const RANGOS_ZONA_SUR = [
    { inicio: 4000, fin: 4999, alcaldia: 'Coyoacán' },
    { inicio: 12000, fin: 12999, alcaldia: 'Milpa Alta' },
    { inicio: 13000, fin: 13999, alcaldia: 'Tláhuac' },
    { inicio: 14000, fin: 14999, alcaldia: 'Tlalpan' },
    { inicio: 16000, fin: 16999, alcaldia: 'Xochimilco' }
];

/**
 * Verifica si un código postal pertenece a la zona de servicio (zona sur de CDMX)
 * @param {string|number} codigoPostal - Código postal a verificar (5 dígitos)
 * @returns {boolean} true si el código postal está en la zona de servicio
 */
export function esZonaServicio(codigoPostal) {
    const cp = typeof codigoPostal === 'string' ? parseInt(codigoPostal, 10) : codigoPostal;

    if (isNaN(cp)) {
        return false;
    }

    return RANGOS_ZONA_SUR.some((rango) => cp >= rango.inicio && cp <= rango.fin);
}

/**
 * Obtiene la alcaldía correspondiente a un código postal de la zona de servicio
 * @param {string|number} codigoPostal - Código postal a consultar
 * @returns {string|null} Nombre de la alcaldía o null si no está en zona de servicio
 */
export function obtenerAlcaldia(codigoPostal) {
    const cp = typeof codigoPostal === 'string' ? parseInt(codigoPostal, 10) : codigoPostal;

    if (isNaN(cp)) {
        return null;
    }

    const rango = RANGOS_ZONA_SUR.find((r) => cp >= r.inicio && cp <= r.fin);
    return rango ? rango.alcaldia : null;
}

export { RANGOS_ZONA_SUR };
