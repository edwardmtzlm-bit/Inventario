package mx.horaciomarchand.importador.core;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Objetos de datos del importador. */
public final class Modelos {

    private Modelos() {
    }

    /** Un producto leído de la hoja de existencias, ya validado. */
    public record ProductoImportado(int fila, String sku, String nombre, String categoria, BigDecimal precio,
                                    int existencia, int stockMinimo, int stockAmazon) {
    }

    /** Un movimiento del historial, ya validado y con el producto resuelto a un SKU. */
    public record MovimientoImportado(int fila, LocalDate fecha, String sku, String nombreProducto,
                                      TipoMovimiento tipo, int cantidad, String responsable, String nota,
                                      String huella) {
    }

    /** Producto que ya existe en la base de datos. */
    public record ProductoExistente(String id, String sku, String nombre) {
    }

    /** Problema encontrado en una fila del Excel. */
    public record ErrorFila(String hoja, int fila, String campo, String mensaje) {
    }

    /** Lo que se importaría (vista previa) o lo que se importó. */
    public record Resumen(boolean aplicado,
                          List<String> hojasLeidas,
                          int productosNuevos,
                          int productosActualizados,
                          int movimientosNuevos,
                          int movimientosDuplicados,
                          int filasConError,
                          List<ErrorFila> errores) {
    }
}
