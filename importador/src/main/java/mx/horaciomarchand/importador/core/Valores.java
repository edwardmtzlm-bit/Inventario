package mx.horaciomarchand.importador.core;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.List;
import java.util.Optional;

/** Conversión de los textos del Excel a números y fechas. */
public final class Valores {

    private static final List<DateTimeFormatter> FORMATOS_FECHA = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE,          // 2026-02-19
            DateTimeFormatter.ofPattern("d/M/uuuu").withResolverStyle(ResolverStyle.STRICT),   // 19/2/2026 y 19/02/2026
            DateTimeFormatter.ofPattern("d/M/uu").withResolverStyle(ResolverStyle.STRICT),     // 19/2/26
            DateTimeFormatter.ofPattern("d-M-uuuu").withResolverStyle(ResolverStyle.STRICT),   // 19-02-2026
            DateTimeFormatter.ofPattern("uuuu/M/d").withResolverStyle(ResolverStyle.STRICT));  // 2026/02/19

    private Valores() {
    }

    public static Optional<LocalDate> fecha(String valor) {
        String v = Texto.limpiar(valor);
        if (v.isEmpty()) {
            return Optional.empty();
        }
        if (v.length() > 10 && v.charAt(10) == 'T') {
            v = v.substring(0, 10); // 2026-02-19T10:30 -> 2026-02-19
        }
        for (DateTimeFormatter formato : FORMATOS_FECHA) {
            try {
                return Optional.of(LocalDate.parse(v, formato));
            } catch (DateTimeParseException ignorado) {
                // probar el siguiente formato
            }
        }
        return Optional.empty();
    }

    /** "$1,200.50" -> 1200.50 */
    public static Optional<BigDecimal> decimal(String valor) {
        String v = Texto.limpiar(valor).replace("$", "").replace(",", "").replace(" ", "");
        if (v.isEmpty()) {
            return Optional.empty();
        }
        try {
            return Optional.of(new BigDecimal(v));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    /** "12", "12.0" o "1,200" -> entero. "12.5" no es entero. */
    public static Optional<Integer> entero(String valor) {
        return decimal(valor).flatMap(d -> {
            try {
                return Optional.of(d.stripTrailingZeros().intValueExact());
            } catch (ArithmeticException e) {
                return Optional.empty();
            }
        });
    }
}
