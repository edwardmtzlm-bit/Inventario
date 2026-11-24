package mx.horaciomarchand.importador.core;

import java.util.Optional;

/**
 * Tipos de movimiento que usa la aplicación (columna "type" de la tabla logs).
 * Traduce lo que se escribió a mano en el Excel al valor del sistema.
 */
public enum TipoMovimiento {
    ENTRY,
    EXIT,
    AMAZON_SALE,
    AMAZON_TRANSFER;

    public static Optional<TipoMovimiento> desdeTexto(String valor) {
        String t = Texto.normalizar(valor);
        if (t.isEmpty()) {
            return Optional.empty();
        }
        // Primero los casos de Amazon, porque "venta amazon" también contiene "venta".
        if (t.contains("amazon")) {
            if (t.contains("venta") || t.contains("vendido") || t.contains("sale")) {
                return Optional.of(AMAZON_SALE);
            }
            return Optional.of(AMAZON_TRANSFER);
        }
        if (t.equals("entry") || empiezaCon(t, "entrada", "ingreso", "compra", "alta", "reabasto", "recepcion", "devolucion")) {
            return Optional.of(ENTRY);
        }
        if (t.equals("exit") || empiezaCon(t, "salida", "venta", "regalo", "envio", "entrega", "baja", "cortesia")) {
            return Optional.of(EXIT);
        }
        return Optional.empty();
    }

    private static boolean empiezaCon(String texto, String... prefijos) {
        for (String p : prefijos) {
            if (texto.startsWith(p)) {
                return true;
            }
        }
        return false;
    }
}
