package mx.horaciomarchand.importador.datos;

import java.sql.Timestamp;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import mx.horaciomarchand.importador.core.Modelos.MovimientoImportado;
import mx.horaciomarchand.importador.core.Modelos.ProductoExistente;
import mx.horaciomarchand.importador.core.Modelos.ProductoImportado;
import mx.horaciomarchand.importador.core.RepositorioInventario;

/**
 * Implementación con JDBC sobre la base de datos PostgreSQL de Supabase.
 * Usa las mismas tablas que la aplicación web: products y logs.
 */
public class RepositorioJdbc implements RepositorioInventario {

    /** Hora a la que se registran los movimientos que en el Excel solo tienen fecha. */
    private static final LocalTime HORA_POR_DEFECTO = LocalTime.NOON;
    private static final ZoneId ZONA = ZoneId.of("America/Monterrey");
    private static final String USUARIO_IMPORTADOR = "importador-excel";

    private final JdbcTemplate jdbc;
    private final NamedParameterJdbcTemplate jdbcNombrado;

    public RepositorioJdbc(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        this.jdbcNombrado = new NamedParameterJdbcTemplate(jdbc);
    }

    @Override
    public List<ProductoExistente> productos() {
        return jdbc.query("select id::text as id, sku, name from products",
                (rs, i) -> new ProductoExistente(rs.getString("id"), rs.getString("sku"), rs.getString("name")));
    }

    @Override
    public Set<String> huellasExistentes(Collection<String> huellas) {
        if (huellas.isEmpty()) {
            return Set.of();
        }
        List<String> encontradas = jdbcNombrado.queryForList(
                "select import_hash from logs where import_hash in (:huellas)",
                new MapSqlParameterSource("huellas", huellas), String.class);
        return new HashSet<>(encontradas);
    }

    @Override
    @Transactional
    public void aplicar(List<ProductoImportado> nuevos, List<ProductoImportado> actualizados,
                        List<MovimientoImportado> movimientos) {
        for (ProductoImportado p : nuevos) {
            jdbc.update("""
                    insert into products (sku, name, category, price, stock, min_stock, amazon_stock, amazon_enabled)
                    values (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    p.sku(), p.nombre(), p.categoria(), p.precio(), p.existencia(), p.stockMinimo(),
                    p.stockAmazon(), p.stockAmazon() > 0);
        }
        for (ProductoImportado p : actualizados) {
            jdbc.update("""
                    update products
                       set name = ?, category = ?, price = ?, stock = ?, min_stock = ?, amazon_stock = ?
                     where sku = ?
                    """,
                    p.nombre(), p.categoria(), p.precio(), p.existencia(), p.stockMinimo(), p.stockAmazon(),
                    p.sku());
        }
        for (MovimientoImportado m : movimientos) {
            Timestamp momento = Timestamp.from(m.fecha().atTime(HORA_POR_DEFECTO).atZone(ZONA).toInstant());
            jdbc.update("""
                    insert into logs (timestamp, type, product_id, product_name, quantity,
                                      user_id, user_name, source, import_hash)
                    values (?, ?, (select id from products where sku = ?), ?, ?, ?, ?, 'excel', ?)
                    on conflict (import_hash) do nothing
                    """,
                    momento, m.tipo().name(), m.sku(), m.nombreProducto(), m.cantidad(),
                    USUARIO_IMPORTADOR, m.responsable(), m.huella());
        }
    }
}
