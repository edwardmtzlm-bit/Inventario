package mx.horaciomarchand.importador;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

import mx.horaciomarchand.importador.core.RepositorioInventario;
import mx.horaciomarchand.importador.core.ServicioImportacion;
import mx.horaciomarchand.importador.datos.RepositorioJdbc;
import mx.horaciomarchand.importador.excel.LectorExcel;

@SpringBootApplication
public class ImportadorApplication {

    public static void main(String[] args) {
        SpringApplication.run(ImportadorApplication.class, args);
    }

    @Bean
    RepositorioInventario repositorioInventario(JdbcTemplate jdbc) {
        return new RepositorioJdbc(jdbc);
    }

    @Bean
    ServicioImportacion servicioImportacion(RepositorioInventario repositorio) {
        return new ServicioImportacion(repositorio);
    }

    @Bean
    LectorExcel lectorExcel() {
        return new LectorExcel();
    }
}
