package mx.horaciomarchand.importador.core;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.Before;
import org.junit.Test;

import mx.horaciomarchand.importador.core.Modelos.ErrorFila;
import mx.horaciomarchand.importador.core.Modelos.MovimientoImportado;
import mx.horaciomarchand.importador.core.Modelos.ProductoExistente;
import mx.horaciomarchand.importador.core.Modelos.ProductoImportado;
import mx.horaciomarchand.importador.core.Modelos.Resumen;

/** Pruebas del flujo completo de importación con una base de datos simulada en memoria. */
public class ServicioImportacionTest {

    private RepositorioEnMemoria repositorio;
    private ServicioImportacion servicio;

    @Before
    public void preparar() {
        repositorio = new RepositorioEnMemoria();
        repositorio.existentes.add(new ProductoExistente("1", "LPP", "Libro Impreso Poder Personal"));
        servicio = new ServicioImportacion(repositorio);
    }

    @Test
    public void laVistaPreviaNoGuardaNada() {
        Resumen r = servicio.vistaPrevia(libroValido());

        assertFalse(r.aplicado());
        assertEquals(1, r.productosNuevos());
        assertEquals(1, r.productosActualizados());
        assertEquals(2, r.movimientosNuevos());
        assertTrue(r.errores().isEmpty());
        assertEquals(0, repositorio.vecesAplicado);
    }

    @Test
    public void importaProductosYMovimientosValidos() {
        Resumen r = servicio.importar(libroValido());

        assertTrue(r.aplicado());
        assertEquals(1, repositorio.vecesAplicado);
        assertEquals("TAZA-01", repositorio.nuevos.get(0).sku());
        assertEquals(2557, repositorio.actualizados.get(0).existencia());
        assertEquals(2, repositorio.movimientos.size());
        assertEquals(TipoMovimiento.AMAZON_TRANSFER, repositorio.movimientos.get(1).tipo());
    }

    @Test
    public void importarDosVecesElMismoArchivoNoDuplicaElHistorial() {
        servicio.importar(libroValido());
        Resumen segunda = servicio.importar(libroValido());

        assertEquals(0, segunda.movimientosNuevos());
        assertEquals(2, segunda.movimientosDuplicados());
        assertEquals(2, repositorio.huellasGuardadas.size());
    }

    @Test
    public void lasFilasConErrorSeReportanYNoSeGuardan() {
        Hoja movimientos = hoja("Movimientos", List.of("Fecha", "SKU", "Tipo", "Cantidad"),
                fila(2, "19/02/2026", "LPP", "Salida", "3"),
                fila(3, "fecha mala", "LPP", "Salida", "1"),
                fila(4, "20/02/2026", "NO-EXISTE", "Salida", "1"),
                fila(5, "20/02/2026", "LPP", "Ajuste", "1"),
                fila(6, "20/02/2026", "LPP", "Entrada", "-4"));

        Resumen r = servicio.importar(List.of(movimientos));

        assertEquals(1, r.movimientosNuevos());
        assertEquals(4, r.filasConError());
        assertEquals(1, repositorio.movimientos.size());
        assertTrue(contieneError(r.errores(), 3, "Fecha"));
        assertTrue(contieneError(r.errores(), 4, "Producto"));
        assertTrue(contieneError(r.errores(), 5, "Tipo"));
        assertTrue(contieneError(r.errores(), 6, "Cantidad"));
    }

    @Test
    public void detectaSkuRepetidoYExistenciaNegativa() {
        Hoja productos = hoja("Inventario", List.of("SKU", "Producto", "Existencia"),
                fila(2, "LHM", "Libro Hipermarketing", "140"),
                fila(3, "LHM", "Libro Hipermarketing", "100"),
                fila(4, "TAZA-02", "Taza negra", "-1"));

        Resumen r = servicio.vistaPrevia(List.of(productos));

        assertEquals(1, r.productosNuevos());
        assertTrue(contieneError(r.errores(), 3, "SKU"));
        assertTrue(contieneError(r.errores(), 4, "Existencia"));
    }

    @Test
    public void reconoceElProductoPorNombreSiNoHaySku() {
        Hoja movimientos = hoja("Historial", List.of("Fecha", "Producto", "Movimiento", "Piezas"),
                fila(2, "2026-02-19", "libro impreso PODER personal", "Venta", "2"));

        Resumen r = servicio.importar(List.of(movimientos));

        assertEquals(1, r.movimientosNuevos());
        assertEquals("LPP", repositorio.movimientos.get(0).sku());
    }

    @Test
    public void avisaSiNingunaHojaTieneColumnasReconocibles() {
        Hoja rara = hoja("Hoja1", List.of("A", "B"), fila(2, "x", "y"));

        Resumen r = servicio.vistaPrevia(List.of(rara));

        assertTrue(r.hojasLeidas().isEmpty());
        assertEquals(1, r.errores().size());
    }

    // ---------- datos de prueba ----------

    private List<Hoja> libroValido() {
        Hoja productos = hoja("Inventario", List.of("SKU", "Producto", "Categoría", "Precio", "Existencia"),
                fila(2, "LPP", "Libro Impreso Poder Personal", "Libros", "$445", "2,557"),
                fila(3, "TAZA-01", "Taza blanca", "Merch", "199", "40"));
        Hoja movimientos = hoja("Movimientos", List.of("Fecha", "SKU", "Tipo", "Cantidad", "Responsable"),
                fila(2, "19/02/2026", "LPP", "Salida", "1", "Alexa"),
                fila(3, "20/02/2026", "TAZA-01", "Envío Amazon", "10", "Alexa"));
        return List.of(productos, movimientos);
    }

    /** Arma una hoja como la entregaría el lector de Excel: cada valor va bajo su encabezado. */
    private static Hoja hoja(String nombre, List<String> encabezados, FilaDatos... filas) {
        List<Hoja.Fila> resultado = new ArrayList<>();
        for (FilaDatos f : filas) {
            Map<String, String> valores = new LinkedHashMap<>();
            for (int i = 0; i < encabezados.size(); i++) {
                valores.put(encabezados.get(i), i < f.valores().length ? f.valores()[i] : "");
            }
            resultado.add(new Hoja.Fila(f.numero(), valores));
        }
        return new Hoja(nombre, encabezados, resultado);
    }

    private record FilaDatos(int numero, String[] valores) {
    }

    private static FilaDatos fila(int numero, String... valores) {
        return new FilaDatos(numero, valores);
    }

    private static boolean contieneError(List<ErrorFila> errores, int fila, String campo) {
        return errores.stream().anyMatch(e -> e.fila() == fila && e.campo().equals(campo));
    }

    /** Base de datos falsa: guarda en listas lo que el servicio le manda. */
    private static class RepositorioEnMemoria implements RepositorioInventario {
        final List<ProductoExistente> existentes = new ArrayList<>();
        final List<ProductoImportado> nuevos = new ArrayList<>();
        final List<ProductoImportado> actualizados = new ArrayList<>();
        final List<MovimientoImportado> movimientos = new ArrayList<>();
        final Set<String> huellasGuardadas = new HashSet<>();
        int vecesAplicado;

        @Override
        public List<ProductoExistente> productos() {
            return existentes;
        }

        @Override
        public Set<String> huellasExistentes(Collection<String> huellas) {
            Set<String> encontradas = new HashSet<>(huellas);
            encontradas.retainAll(huellasGuardadas);
            return encontradas;
        }

        @Override
        public void aplicar(List<ProductoImportado> nuevos, List<ProductoImportado> actualizados,
                            List<MovimientoImportado> movimientos) {
            vecesAplicado++;
            this.nuevos.addAll(nuevos);
            this.actualizados.addAll(actualizados);
            this.movimientos.addAll(movimientos);
            for (ProductoImportado p : nuevos) {
                existentes.add(new ProductoExistente(p.sku(), p.sku(), p.nombre()));
            }
            for (MovimientoImportado m : movimientos) {
                huellasGuardadas.add(m.huella());
            }
        }
    }
}
