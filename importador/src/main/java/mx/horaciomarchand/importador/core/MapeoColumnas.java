package mx.horaciomarchand.importador.core;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Relaciona cada {@link Campo} con el encabezado real de la hoja. */
public final class MapeoColumnas {

    private final Map<Campo, String> columnas;

    private MapeoColumnas(Map<Campo, String> columnas) {
        this.columnas = columnas;
    }

    public static MapeoColumnas desde(List<String> encabezados) {
        Map<Campo, String> mapa = new EnumMap<>(Campo.class);
        for (String encabezado : encabezados) {
            for (Campo campo : Campo.values()) {
                if (!mapa.containsKey(campo) && campo.coincide(encabezado)) {
                    mapa.put(campo, encabezado);
                    break;
                }
            }
        }
        return new MapeoColumnas(mapa);
    }

    public boolean tiene(Campo campo) {
        return columnas.containsKey(campo);
    }

    public Optional<String> encabezado(Campo campo) {
        return Optional.ofNullable(columnas.get(campo));
    }

    public String valor(Hoja.Fila fila, Campo campo) {
        return fila.valor(columnas.get(campo));
    }

    /** Hoja de movimientos: trae fecha, tipo, cantidad y algo que identifique el producto. */
    public boolean esHojaDeMovimientos() {
        return tiene(Campo.FECHA) && tiene(Campo.TIPO) && tiene(Campo.CANTIDAD)
                && (tiene(Campo.SKU) || tiene(Campo.NOMBRE));
    }

    /** Hoja de productos: trae el producto y su existencia, sin tipo de movimiento. */
    public boolean esHojaDeProductos() {
        return !esHojaDeMovimientos() && tiene(Campo.EXISTENCIA)
                && (tiene(Campo.SKU) || tiene(Campo.NOMBRE));
    }
}
