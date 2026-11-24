package mx.horaciomarchand.importador.core;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import mx.horaciomarchand.importador.core.Modelos.ErrorFila;
import mx.horaciomarchand.importador.core.Modelos.MovimientoImportado;
import mx.horaciomarchand.importador.core.Modelos.ProductoExistente;
import mx.horaciomarchand.importador.core.Modelos.ProductoImportado;

/**
 * Revisa cada fila del Excel y separa lo que se puede importar de lo que tiene errores.
 * No toca la base de datos: recibe la lista de productos que ya existen.
 */
public final class Validador {

    static final String RESPONSABLE_POR_DEFECTO = "Importado de Excel";
    static final String CATEGORIA_POR_DEFECTO = "Otros";
    static final int STOCK_MINIMO_POR_DEFECTO = 5;

    public record Resultado(List<String> hojasLeidas,
                            List<ProductoImportado> productos,
                            List<MovimientoImportado> movimientos,
                            List<ErrorFila> errores) {
    }

    public Resultado validar(List<Hoja> hojas, List<ProductoExistente> existentes) {
        List<String> leidas = new ArrayList<>();
        List<ErrorFila> errores = new ArrayList<>();
        List<ProductoImportado> productos = new ArrayList<>();
        List<Hoja> hojasMovimientos = new ArrayList<>();

        for (Hoja hoja : hojas) {
            MapeoColumnas mapeo = MapeoColumnas.desde(hoja.encabezados());
            if (mapeo.esHojaDeProductos()) {
                leidas.add(hoja.nombre() + " (productos)");
                productos.addAll(validarProductos(hoja, mapeo, existentes, errores));
            } else if (mapeo.esHojaDeMovimientos()) {
                leidas.add(hoja.nombre() + " (movimientos)");
                hojasMovimientos.add(hoja);
            }
        }
        if (leidas.isEmpty()) {
            errores.add(new ErrorFila("", 0, "",
                    "No se encontró ninguna hoja con columnas de productos (producto/SKU y existencia) "
                            + "ni de movimientos (fecha, tipo, cantidad y producto/SKU)."));
        }

        CatalogoProductos catalogo = new CatalogoProductos(existentes, productos);
        List<MovimientoImportado> movimientos = new ArrayList<>();
        Map<String, Integer> ocurrencias = new HashMap<>();
        for (Hoja hoja : hojasMovimientos) {
            MapeoColumnas mapeo = MapeoColumnas.desde(hoja.encabezados());
            movimientos.addAll(validarMovimientos(hoja, mapeo, catalogo, ocurrencias, errores));
        }
        return new Resultado(leidas, productos, movimientos, errores);
    }

    private List<ProductoImportado> validarProductos(Hoja hoja, MapeoColumnas m,
                                                     List<ProductoExistente> existentes,
                                                     List<ErrorFila> errores) {
        List<ProductoImportado> salida = new ArrayList<>();
        Set<String> skusVistos = new HashSet<>();
        Map<String, ProductoExistente> porNombre = new HashMap<>();
        for (ProductoExistente p : existentes) {
            porNombre.put(Texto.normalizar(p.nombre()), p);
        }

        for (Hoja.Fila fila : hoja.filas()) {
            int erroresAntes = errores.size();
            String nombre = m.valor(fila, Campo.NOMBRE);
            String sku = m.valor(fila, Campo.SKU);

            if (Texto.vacio(sku)) {
                ProductoExistente existente = porNombre.get(Texto.normalizar(nombre));
                if (existente != null) {
                    sku = existente.sku();
                } else {
                    errores.add(error(hoja, fila, "SKU", "Falta el SKU y el producto \"" + nombre
                            + "\" no existe en el sistema. Agrega el SKU en el Excel."));
                }
            }
            if (Texto.vacio(nombre)) {
                errores.add(error(hoja, fila, "Producto", "Falta el nombre del producto."));
            }
            if (!Texto.vacio(sku) && !skusVistos.add(Texto.normalizar(sku))) {
                errores.add(error(hoja, fila, "SKU", "El SKU " + sku + " está repetido en la hoja."));
            }

            Optional<Integer> existencia = Valores.entero(m.valor(fila, Campo.EXISTENCIA));
            if (existencia.isEmpty()) {
                errores.add(error(hoja, fila, "Existencia", "La existencia debe ser un número entero."));
            } else if (existencia.get() < 0) {
                errores.add(error(hoja, fila, "Existencia", "La existencia no puede ser negativa."));
            }

            BigDecimal precio = BigDecimal.ZERO;
            String precioTexto = m.valor(fila, Campo.PRECIO);
            if (!Texto.vacio(precioTexto)) {
                Optional<BigDecimal> p = Valores.decimal(precioTexto);
                if (p.isEmpty() || p.get().signum() < 0) {
                    errores.add(error(hoja, fila, "Precio", "El precio no es válido: " + precioTexto));
                } else {
                    precio = p.get();
                }
            }

            int minimo = enteroOpcional(hoja, fila, m, Campo.STOCK_MINIMO, "Stock mínimo",
                    STOCK_MINIMO_POR_DEFECTO, errores);
            int amazon = enteroOpcional(hoja, fila, m, Campo.STOCK_AMAZON, "Stock Amazon", 0, errores);

            String categoria = m.valor(fila, Campo.CATEGORIA);
            if (Texto.vacio(categoria)) {
                categoria = CATEGORIA_POR_DEFECTO;
            }

            if (errores.size() == erroresAntes) {
                salida.add(new ProductoImportado(fila.numero(), sku.trim(), nombre.trim(), categoria.trim(),
                        precio, existencia.get(), minimo, amazon));
            }
        }
        return salida;
    }

    private List<MovimientoImportado> validarMovimientos(Hoja hoja, MapeoColumnas m, CatalogoProductos catalogo,
                                                         Map<String, Integer> ocurrencias,
                                                         List<ErrorFila> errores) {
        List<MovimientoImportado> salida = new ArrayList<>();
        for (Hoja.Fila fila : hoja.filas()) {
            int erroresAntes = errores.size();

            Optional<LocalDate> fecha = Valores.fecha(m.valor(fila, Campo.FECHA));
            if (fecha.isEmpty()) {
                errores.add(error(hoja, fila, "Fecha", "Fecha no válida: \"" + m.valor(fila, Campo.FECHA) + "\"."));
            } else if (fecha.get().isAfter(LocalDate.now().plusDays(1))) {
                errores.add(error(hoja, fila, "Fecha", "La fecha " + fecha.get() + " está en el futuro."));
            }

            Optional<TipoMovimiento> tipo = TipoMovimiento.desdeTexto(m.valor(fila, Campo.TIPO));
            if (tipo.isEmpty()) {
                errores.add(error(hoja, fila, "Tipo", "No se reconoce el tipo de movimiento \""
                        + m.valor(fila, Campo.TIPO) + "\". Usa Entrada, Salida, Envío Amazon o Venta Amazon."));
            }

            Optional<Integer> cantidad = Valores.entero(m.valor(fila, Campo.CANTIDAD));
            if (cantidad.isEmpty() || cantidad.get() <= 0) {
                errores.add(error(hoja, fila, "Cantidad", "La cantidad debe ser un entero mayor que cero."));
            }

            Optional<CatalogoProductos.Producto> producto =
                    catalogo.buscar(m.valor(fila, Campo.SKU), m.valor(fila, Campo.NOMBRE));
            if (producto.isEmpty()) {
                errores.add(error(hoja, fila, "Producto", "El producto \""
                        + primeroNoVacio(m.valor(fila, Campo.SKU), m.valor(fila, Campo.NOMBRE))
                        + "\" no está en el sistema ni en la hoja de productos."));
            }

            if (errores.size() == erroresAntes) {
                String responsable = m.valor(fila, Campo.RESPONSABLE);
                if (Texto.vacio(responsable)) {
                    responsable = RESPONSABLE_POR_DEFECTO;
                }
                String sku = producto.get().sku();
                String clave = String.join("|", fecha.get().toString(), Texto.normalizar(sku), tipo.get().name(),
                        cantidad.get().toString(), Texto.normalizar(responsable));
                int ocurrencia = ocurrencias.merge(clave, 1, Integer::sum);
                String huella = Huella.de(fecha.get(), sku, tipo.get(), cantidad.get(), responsable, ocurrencia);
                salida.add(new MovimientoImportado(fila.numero(), fecha.get(), sku, producto.get().nombre(),
                        tipo.get(), cantidad.get(), responsable.trim(), m.valor(fila, Campo.NOTA), huella));
            }
        }
        return salida;
    }

    private int enteroOpcional(Hoja hoja, Hoja.Fila fila, MapeoColumnas m, Campo campo, String etiqueta,
                               int porDefecto, List<ErrorFila> errores) {
        String texto = m.valor(fila, campo);
        if (Texto.vacio(texto)) {
            return porDefecto;
        }
        Optional<Integer> n = Valores.entero(texto);
        if (n.isEmpty() || n.get() < 0) {
            errores.add(error(hoja, fila, etiqueta, etiqueta + " debe ser un entero mayor o igual a cero."));
            return porDefecto;
        }
        return n.get();
    }

    private static ErrorFila error(Hoja hoja, Hoja.Fila fila, String campo, String mensaje) {
        return new ErrorFila(hoja.nombre(), fila.numero(), campo, mensaje);
    }

    private static String primeroNoVacio(String a, String b) {
        return Texto.vacio(a) ? b : a;
    }

    /** Productos conocidos: los de la base de datos más los que vienen en la hoja de productos. */
    static final class CatalogoProductos {
        record Producto(String sku, String nombre) {
        }

        private final Map<String, Producto> porSku = new HashMap<>();
        private final Map<String, Producto> porNombre = new HashMap<>();

        CatalogoProductos(List<ProductoExistente> existentes, List<ProductoImportado> importados) {
            for (ProductoExistente p : existentes) {
                agregar(p.sku(), p.nombre());
            }
            for (ProductoImportado p : importados) {
                agregar(p.sku(), p.nombre());
            }
        }

        private void agregar(String sku, String nombre) {
            Producto p = new Producto(sku, nombre);
            porSku.put(Texto.normalizar(sku), p);
            porNombre.putIfAbsent(Texto.normalizar(nombre), p);
        }

        Optional<Producto> buscar(String sku, String nombre) {
            if (!Texto.vacio(sku)) {
                Producto p = porSku.get(Texto.normalizar(sku));
                if (p != null) {
                    return Optional.of(p);
                }
            }
            if (!Texto.vacio(nombre)) {
                return Optional.ofNullable(porNombre.get(Texto.normalizar(nombre)));
            }
            return Optional.empty();
        }
    }
}
