package mx.horaciomarchand.importador.core;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.Test;

/** Pruebas de las conversiones básicas: textos, números, fechas, tipos de movimiento y columnas. */
public class ConversionesTest {

    @Test
    public void normalizaAcentosMayusculasYEspacios() {
        assertEquals("stock minimo", Texto.normalizar("  Stock_Mínimo "));
        assertEquals("", Texto.normalizar(null));
    }

    @Test
    public void leeNumerosConFormatoDeMoneda() {
        assertEquals(new BigDecimal("1200.50"), Valores.decimal("$1,200.50").orElseThrow());
        assertEquals(Integer.valueOf(12), Valores.entero("12.0").orElseThrow());
        assertEquals(Integer.valueOf(2557), Valores.entero("2,557").orElseThrow());
        assertFalse(Valores.entero("12.5").isPresent());
        assertFalse(Valores.entero("doce").isPresent());
    }

    @Test
    public void leeLosFormatosDeFechaMasComunes() {
        LocalDate esperada = LocalDate.of(2026, 2, 19);
        assertEquals(esperada, Valores.fecha("2026-02-19").orElseThrow());
        assertEquals(esperada, Valores.fecha("19/02/2026").orElseThrow());
        assertEquals(esperada, Valores.fecha("19/2/2026").orElseThrow());
        assertEquals(esperada, Valores.fecha("19/2/26").orElseThrow());
        assertEquals(esperada, Valores.fecha("2026-02-19T10:30").orElseThrow());
        assertFalse(Valores.fecha("ayer").isPresent());
        assertFalse(Valores.fecha("31/02/2026").isPresent());
    }

    @Test
    public void traduceTiposDeMovimientoEscritosAMano() {
        assertEquals(TipoMovimiento.ENTRY, TipoMovimiento.desdeTexto("Entrada").orElseThrow());
        assertEquals(TipoMovimiento.EXIT, TipoMovimiento.desdeTexto("salida").orElseThrow());
        assertEquals(TipoMovimiento.EXIT, TipoMovimiento.desdeTexto("Regalo").orElseThrow());
        assertEquals(TipoMovimiento.AMAZON_TRANSFER, TipoMovimiento.desdeTexto("Envío Amazon").orElseThrow());
        assertEquals(TipoMovimiento.AMAZON_SALE, TipoMovimiento.desdeTexto("VENTA AMAZON").orElseThrow());
        assertFalse(TipoMovimiento.desdeTexto("ajuste raro").isPresent());
    }

    @Test
    public void reconoceColumnasConNombresDistintos() {
        MapeoColumnas productos = MapeoColumnas.desde(List.of("Código", "Producto", "Existencia", "Precio"));
        assertTrue(productos.esHojaDeProductos());
        assertFalse(productos.esHojaDeMovimientos());

        MapeoColumnas movimientos = MapeoColumnas.desde(List.of("Fecha", "Producto", "Movimiento", "Piezas"));
        assertTrue(movimientos.esHojaDeMovimientos());
        assertFalse(movimientos.esHojaDeProductos());
    }

    @Test
    public void laHuellaDistingueMovimientosRepetidosElMismoDia() {
        LocalDate dia = LocalDate.of(2026, 2, 19);
        String primera = Huella.de(dia, "LPP", TipoMovimiento.EXIT, 1, "Alexa", 1);
        String repetida = Huella.de(dia, "lpp", TipoMovimiento.EXIT, 1, "ALEXA", 1);
        String segunda = Huella.de(dia, "LPP", TipoMovimiento.EXIT, 1, "Alexa", 2);
        assertEquals(primera, repetida);
        assertNotEquals(primera, segunda);
        assertEquals(64, primera.length());
    }
}
