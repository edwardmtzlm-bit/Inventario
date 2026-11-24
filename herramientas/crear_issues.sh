#!/usr/bin/env bash
# Crea etiquetas, milestones e issues del proyecto en GitHub.
# Requisitos: GitHub CLI (gh) instalado y sesión iniciada con: gh auth login
# Uso: desde la carpeta del repositorio, ejecutar: bash herramientas/crear_issues.sh
set -e
REPO="edwardmtzlm-bit/Inventario"
echo '== Etiquetas =='
gh label create 'seguridad' --repo "$REPO" --color B60205 --description 'Autenticación, permisos y protección de datos' --force
gh label create 'importación' --repo "$REPO" --color 0E8A16 --description 'Importador de Excel' --force
gh label create 'java' --repo "$REPO" --color 5319E7 --description 'Código del servicio Java' --force
gh label create 'frontend' --repo "$REPO" --color 1D76DB --description 'Aplicación React' --force
gh label create 'base de datos' --repo "$REPO" --color 006B75 --description 'Esquema y migraciones de Supabase' --force
gh label create 'calidad' --repo "$REPO" --color FBCA04 --description 'Pruebas' --force
gh label create 'ci' --repo "$REPO" --color FBCA04 --description 'Integración continua' --force
gh label create 'infraestructura' --repo "$REPO" --color C5DEF5 --description 'Despliegue y servidores' --force
gh label create 'implementación' --repo "$REPO" --color 0052CC --description 'Puesta en marcha con la empresa' --force
gh label create 'documentación' --repo "$REPO" --color D4C5F9 --description 'Guías y documentos' --force
gh label create 'gestión' --repo "$REPO" --color BFDADC --description 'Administración del proyecto' --force
gh label create 'release' --repo "$REPO" --color 000000 --description 'Liberación de versión' --force
gh label create 'catálogo' --repo "$REPO" --color C2E0C6 --description 'Productos' --force
gh label create 'movimientos' --repo "$REPO" --color C2E0C6 --description 'Entradas, salidas y bitácora' --force
gh label create 'órdenes' --repo "$REPO" --color C2E0C6 --description 'Órdenes y entregas' --force
gh label create 'amazon' --repo "$REPO" --color F9D0C4 --description 'Canal Amazon' --force
gh label create 'reportes' --repo "$REPO" --color C2E0C6 --description 'Dashboard y reportes' --force
gh label create 'shopify' --repo "$REPO" --color 96BF48 --description 'Integración con Shopify' --force
gh label create 'versión base' --repo "$REPO" --color EDEDED --description 'Ya existía antes del proyecto' --force
gh label create 'fuera de alcance v1' --repo "$REPO" --color E99695 --description 'No se cubre en la primera versión' --force
gh label create 'prioridad: alta' --repo "$REPO" --color D93F0B --description '' --force
gh label create 'prioridad: media' --repo "$REPO" --color FBCA04 --description '' --force
gh label create 'prioridad: baja' --repo "$REPO" --color C5DEF5 --description '' --force
gh label create 'talla: S' --repo "$REPO" --color EDEDED --description 'Estimación de hasta 2 h' --force
gh label create 'talla: M' --repo "$REPO" --color EDEDED --description 'Estimación de 3 a 4 h' --force
gh label create 'talla: L' --repo "$REPO" --color EDEDED --description 'Estimación de 6 a 8 h' --force
echo '== Milestones =='
gh api "repos/$REPO/milestones" -f title='Beta' -f description='Código en desarrollo: importador Java, pruebas JUnit, CI y migración' -f due_on='2026-11-26T23:59:00Z' >/dev/null || echo 'Milestone Beta ya existe'
gh api "repos/$REPO/milestones" -f title='RC' -f description='Candidata a liberación: pantalla de importación, seguridad y despliegue' -f due_on='2026-11-30T23:59:00Z' >/dev/null || echo 'Milestone RC ya existe'
gh api "repos/$REPO/milestones" -f title='GA' -f description='Versión final en uso por la empresa, capacitación y medición' -f due_on='2026-12-03T23:59:00Z' >/dev/null || echo 'Milestone GA ya existe'
echo '== Issues =='
CUERPO=$(mktemp)
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
El usuario y la contraseña de acceso están escritos en `constants.tsx` y viajan dentro de la app publicada.

## Análisis
Cualquier persona con acceso al repositorio o al código de la app puede verlos. El repositorio es público.

## Solución
Mover los valores a variables de entorno (`.env.local` en desarrollo y variables de Vercel en producción), quitarlos del código y cambiar la contraseña antes de la puesta en marcha.

## Criterios de aceptación
- [ ] No hay contraseñas ni llaves en el código fuente
- [ ] La app sigue funcionando con las variables de entorno
- [ ] La contraseña anterior fue cambiada

**Estimación:** 2 h  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-04 Quitar credenciales del código y usar variables de entorno' --body-file "$CUERPO" --label 'seguridad,prioridad: alta,talla: S' --milestone 'Beta')
echo "[1/35] $URL"
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
La base de datos necesita columnas e índices para importar el historial sin duplicados.

## Análisis
La tabla `logs` no distingue movimientos importados ni tiene una forma de detectar repetidos. `products.sku` no es único y `stock` admite negativos (RF-13).

## Solución
Script `importador/sql/001_importacion_excel.sql`: columnas `source` e `import_hash` en `logs`, índice único en `import_hash` y en `products.sku`, restricción `stock >= 0`.

## Criterios de aceptación
- [ ] El script corre sin errores en Supabase
- [ ] No existen SKUs duplicados
- [ ] Un `update` con stock negativo es rechazado

**Estimación:** 1 h  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'Migración SQL para la importación de Excel' --body-file "$CUERPO" --label 'base de datos,prioridad: alta,talla: S' --milestone 'Beta')
echo "[2/35] $URL"
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Servicio en Spring Boot que recibe el archivo .xlsx, lo lee con Apache POI, valida cada fila y devuelve una vista previa sin guardar nada.

## Análisis
El Excel actual se llena a mano: los nombres de columnas, formatos de fecha y números varían. Hay que reconocer las hojas de productos y de movimientos aunque las columnas se llamen distinto y reportar errores por hoja, fila y campo.

## Solución
Paquete `core` en Java puro (Texto, Valores, Campo, MapeoColumnas, TipoMovimiento, Validador) independiente de Spring para poder probarlo con JUnit. `LectorExcel` con Apache POI. Endpoint `POST /api/importacion/vista-previa`.

## Criterios de aceptación
- [ ] Reconoce columnas con sinónimos (Código/SKU, Piezas/Cantidad, Movimiento/Tipo)
- [ ] Reporta fechas, cantidades y productos inválidos con número de fila
- [ ] La vista previa no escribe en la base de datos

**Estimación:** 8 h  
**Depende de:** Migración SQL
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-23 / RF-24 Importador Java: lectura del Excel, validación y vista previa' --body-file "$CUERPO" --label 'importación,java,prioridad: alta,talla: L' --milestone 'Beta')
echo "[3/35] $URL"
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Guardar los productos (nuevos y actualizados) y el historial completo de movimientos en las tablas `products` y `logs`.

## Análisis
Si la importación falla a la mitad, la base quedaría inconsistente. Los movimientos importados deben conservar su fecha original y distinguirse de los registrados en la app.

## Solución
`RepositorioJdbc` con Spring JDBC: inserción y actualización por SKU, movimientos con `source = 'excel'`, todo en una sola transacción (`@Transactional`). Endpoint `POST /api/importacion`.

## Criterios de aceptación
- [ ] Los productos nuevos se crean y los existentes se actualizan por SKU
- [ ] Cada movimiento conserva su fecha y queda marcado como importado
- [ ] Si ocurre un error no se guarda nada

**Estimación:** 6 h  
**Depende de:** RF-23 / RF-24
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-25 / RF-26 Importar productos e historial a Supabase' --body-file "$CUERPO" --label 'importación,java,prioridad: alta,talla: L' --milestone 'Beta')
echo "[4/35] $URL"
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Si el mismo archivo se importa dos veces, el historial no debe repetirse. Al terminar se muestra cuánto se cargó y cuánto se rechazó.

## Análisis
Dos movimientos idénticos el mismo día pueden ser reales (dos ventas de 1 libro), así que no basta con comparar los datos.

## Solución
Huella SHA-256 por movimiento (fecha, SKU, tipo, cantidad, responsable y número de ocurrencia) guardada en `import_hash` con índice único. Resumen con productos nuevos/actualizados, movimientos nuevos/duplicados y errores.

## Criterios de aceptación
- [ ] Reimportar el mismo archivo no agrega movimientos
- [ ] Dos movimientos idénticos el mismo día se importan ambos
- [ ] El resumen indica filas con error

**Estimación:** 3 h  
**Depende de:** RF-25 / RF-26
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-27 / RF-28 Evitar duplicados y mostrar resumen de importación' --body-file "$CUERPO" --label 'importación,java,prioridad: media,talla: M' --milestone 'Beta')
echo "[5/35] $URL"
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Pruebas automáticas que corren en cada push.

## Análisis
La lógica de validación es la parte más delicada; un cambio podría romperla sin que nadie lo note.

## Solución
Pruebas JUnit de conversiones, mapeo de columnas, tipos de movimiento, huellas, flujo completo con repositorio en memoria y lector de Excel con un archivo creado en memoria. `.travis.yml` ejecuta `mvn test` en `main`, `develop` y ramas `feature/*`.

## Criterios de aceptación
- [ ] `mvn test` pasa localmente
- [ ] Travis CI muestra el build en verde
- [ ] Un error en la lógica hace fallar el build

**Estimación:** 3 h  
**Depende de:** RF-23 / RF-24
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'Pruebas JUnit del importador e integración continua con Travis CI' --body-file "$CUERPO" --label 'calidad,ci,prioridad: alta,talla: M' --milestone 'Beta')
echo "[6/35] $URL"
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Tablero del proyecto sincronizado con los issues de GitHub.

## Análisis
La materia pide integrar el repositorio con una herramienta de administración de proyectos.

## Solución
Conectar Zube con el repositorio `Inventario`, columnas Backlog / En progreso / En revisión / Hecho y vista por milestone (Beta, RC, GA).

## Criterios de aceptación
- [ ] Los issues aparecen en el tablero de Zube
- [ ] Mover una tarjeta actualiza el issue en GitHub

**Estimación:** 1 h  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'Configurar Zube con los issues y milestones del repositorio' --body-file "$CUERPO" --label 'gestión,prioridad: media,talla: S' --milestone 'Beta')
echo "[7/35] $URL"
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Pantalla en la app (solo administrador) para subir el archivo, ver la vista previa con errores y confirmar la importación.

## Análisis
El servicio Java no tiene interfaz; la usuaria necesita hacerlo desde la app sin herramientas técnicas.

## Solución
Componente React que envía el archivo a `/api/importacion/vista-previa`, muestra el resumen y los errores en tabla y, al confirmar, llama a `/api/importacion`.

## Criterios de aceptación
- [ ] Se puede subir un .xlsx desde el celular o la computadora
- [ ] Los errores se ven con hoja, fila y motivo
- [ ] El botón Importar solo se activa después de la vista previa

**Estimación:** 6 h  
**Depende de:** RF-27 / RF-28, Despliegue del importador
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-23 Pantalla «Importar Excel» en la aplicación' --body-file "$CUERPO" --label 'importación,frontend,prioridad: alta,talla: L' --milestone 'RC')
echo "[8/35] $URL"
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Publicar el servicio Java en Render con Docker.

## Análisis
El plan gratuito de Render se suspende por inactividad (~50 s en la primera petición); es aceptable porque la importación es ocasional.

## Solución
Nuevo Web Service en Render con el `Dockerfile` de `importador/`, variables `SUPABASE_DB_URL`, `SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD`, `IMPORTADOR_API_KEY` y `ORIGENES_PERMITIDOS`.

## Criterios de aceptación
- [ ] `GET /api/salud` responde `ok`
- [ ] Las llaves solo existen como variables de entorno en Render

**Estimación:** 2 h  
**Depende de:** RF-25 / RF-26
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'Desplegar el importador en Render' --body-file "$CUERPO" --label 'infraestructura,prioridad: alta,talla: S' --milestone 'RC')
echo "[9/35] $URL"
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Reemplazar el login validado en el navegador por cuentas reales de Supabase Auth.

## Análisis
Hoy el acceso se compara contra un valor fijo en el código.

## Solución
Usar `supabase.auth.signInWithPassword` y guardar la sesión; crear las cuentas de la administradora y del operador.

## Criterios de aceptación
- [ ] Solo se entra con una cuenta válida
- [ ] La contraseña no está en el código

**Estimación:** 4 h  
**Depende de:** RF-04
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-01 Inicio de sesión con Supabase Auth' --body-file "$CUERPO" --label 'seguridad,prioridad: alta,talla: M' --milestone 'RC')
echo "[10/35] $URL"
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
El operador registra órdenes y entregas; solo el administrador borra, importa y edita precios.

## Análisis
Hoy cualquier usuario puede hacer todo.

## Solución
Tabla `profiles` con el rol de cada usuario; la interfaz oculta las acciones según el rol.

## Criterios de aceptación
- [ ] El operador no ve Importar ni Borrar
- [ ] El administrador conserva todas las funciones

**Estimación:** 4 h  
**Depende de:** RF-01
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-02 Roles de administrador y operador' --body-file "$CUERPO" --label 'seguridad,prioridad: alta,talla: M' --milestone 'RC')
echo "[11/35] $URL"
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Proteger los datos desde la base de datos, no solo desde la interfaz.

## Análisis
La llave pública de Supabase viaja en la app; sin RLS cualquiera con esa llave podría leer o escribir.

## Solución
Activar RLS en `products`, `orders`, `logs` y `raw_materials` con políticas por usuario autenticado y rol.

## Criterios de aceptación
- [ ] Sin sesión no se puede leer ni escribir
- [ ] El operador no puede borrar

**Estimación:** 3 h  
**Depende de:** RF-01, RF-02
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-03 Row Level Security en todas las tablas' --body-file "$CUERPO" --label 'seguridad,base de datos,prioridad: alta,talla: M' --milestone 'RC')
echo "[12/35] $URL"
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Cerrar sesión manualmente y de forma automática tras un periodo sin uso.

## Análisis
La app se usa desde celulares que pueden quedar desbloqueados.

## Solución
Botón de salir con `supabase.auth.signOut()` y temporizador de inactividad.

## Criterios de aceptación
- [ ] El botón cierra la sesión
- [ ] Tras el tiempo de inactividad se pide iniciar sesión de nuevo

**Estimación:** 1 h  
**Depende de:** RF-01
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-05 Cierre de sesión y expiración por inactividad' --body-file "$CUERPO" --label 'seguridad,prioridad: media,talla: S' --milestone 'RC')
echo "[13/35] $URL"
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Migrar el inventario de Excel de la empresa a la app.

## Análisis
El Excel puede tener diferencias contra lo que hay físicamente.

## Solución
Vista previa, corrección de errores en el archivo, importación y comparación de existencias contra un conteo físico. El Excel se conserva como respaldo.

## Criterios de aceptación
- [ ] Existencias de la app coinciden con el conteo físico
- [ ] Historial importado visible en la bitácora

**Estimación:** 3 h  
**Depende de:** Pantalla Importar Excel
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'Importar el Excel real y conciliar contra el conteo físico' --body-file "$CUERPO" --label 'implementación,prioridad: alta,talla: M' --milestone 'GA')
echo "[14/35] $URL"
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Sesión práctica con la jefa del área creativa y una guía breve.

## Análisis
Si la usuaria no adopta la app, el problema del Excel no se resuelve.

## Solución
Sesión de 1 h usando casos reales (entrada, salida, envío a Amazon, reporte) y guía de una página.

## Criterios de aceptación
- [ ] La usuaria registra movimientos sola
- [ ] Guía entregada

**Estimación:** 2 h  
**Depende de:** Importar el Excel real
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'Capacitación a la usuaria y guía de uso' --body-file "$CUERPO" --label 'implementación,documentación,prioridad: alta,talla: S' --milestone 'GA')
echo "[15/35] $URL"
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Comparar el proceso en Excel contra la app para el reporte final.

## Análisis
La Fase IV requiere resultados medibles.

## Solución
Medir tiempo de registro de un movimiento, tiempo para saber existencias y diferencias de inventario, antes y después.

## Criterios de aceptación
- [ ] Tabla de indicadores antes/después

**Estimación:** 3 h  
**Depende de:** Capacitación
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-22 Medición de resultados antes y después' --body-file "$CUERPO" --label 'implementación,prioridad: media,talla: M' --milestone 'GA')
echo "[16/35] $URL"
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Publicar la versión final.

## Análisis
`main` es la rama de producción (equivale a `master`); Vercel publica desde ella.

## Solución
Pull request de `develop` a `main`, etiqueta `v1.0.0` y notas de la versión.

## Criterios de aceptación
- [ ] Build de Travis en verde en main
- [ ] Etiqueta v1.0.0 creada

**Estimación:** 1 h  
**Depende de:** Todos los issues de GA
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'Liberación GA: develop → main y versión v1.0.0' --body-file "$CUERPO" --label 'release,prioridad: alta,talla: S' --milestone 'GA')
echo "[17/35] $URL"
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Confirmación antes de borrar una orden. Funcionalidad ya disponible en la versión base de la aplicación.

## Análisis
Se documenta como issue para tener todos los requerimientos de la Fase II en el repositorio.

## Solución
Implementado en la versión base (ver historial de commits y capturas del anexo de la Fase II).

## Criterios de aceptación
- [ ] Funciona en la app publicada

**Estimación:** —  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-06 Confirmación antes de borrar una orden' --body-file "$CUERPO" --label 'seguridad,versión base')
echo "[18/35] $URL"
gh issue close "$URL" --repo "$REPO" --reason completed --comment 'Implementado en la versión base.' >/dev/null
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Alta y edición de productos. Funcionalidad ya disponible en la versión base de la aplicación.

## Análisis
Se documenta como issue para tener todos los requerimientos de la Fase II en el repositorio.

## Solución
Implementado en la versión base (ver historial de commits y capturas del anexo de la Fase II).

## Criterios de aceptación
- [ ] Funciona en la app publicada

**Estimación:** —  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-07 Alta y edición de productos' --body-file "$CUERPO" --label 'catálogo,versión base')
echo "[19/35] $URL"
gh issue close "$URL" --repo "$REPO" --reason completed --comment 'Implementado en la versión base.' >/dev/null
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Bundles (paquetes de productos). Funcionalidad ya disponible en la versión base de la aplicación.

## Análisis
Se documenta como issue para tener todos los requerimientos de la Fase II en el repositorio.

## Solución
Implementado en la versión base (ver historial de commits y capturas del anexo de la Fase II).

## Criterios de aceptación
- [ ] Funciona en la app publicada

**Estimación:** —  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-08 Bundles (paquetes de productos)' --body-file "$CUERPO" --label 'catálogo,versión base')
echo "[20/35] $URL"
gh issue close "$URL" --repo "$REPO" --reason completed --comment 'Implementado en la versión base.' >/dev/null
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Control de materia prima (camisas por talla y color). Funcionalidad ya disponible en la versión base de la aplicación.

## Análisis
Se documenta como issue para tener todos los requerimientos de la Fase II en el repositorio.

## Solución
Implementado en la versión base (ver historial de commits y capturas del anexo de la Fase II).

## Criterios de aceptación
- [ ] Funciona en la app publicada

**Estimación:** —  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-09 Control de materia prima (camisas por talla y color)' --body-file "$CUERPO" --label 'catálogo,versión base')
echo "[21/35] $URL"
gh issue close "$URL" --repo "$REPO" --reason completed --comment 'Implementado en la versión base.' >/dev/null
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Registro de entradas y salidas. Funcionalidad ya disponible en la versión base de la aplicación.

## Análisis
Se documenta como issue para tener todos los requerimientos de la Fase II en el repositorio.

## Solución
Implementado en la versión base (ver historial de commits y capturas del anexo de la Fase II).

## Criterios de aceptación
- [ ] Funciona en la app publicada

**Estimación:** —  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-10 Registro de entradas y salidas' --body-file "$CUERPO" --label 'movimientos,versión base')
echo "[22/35] $URL"
gh issue close "$URL" --repo "$REPO" --reason completed --comment 'Implementado en la versión base.' >/dev/null
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Bitácora de movimientos. Funcionalidad ya disponible en la versión base de la aplicación.

## Análisis
Se documenta como issue para tener todos los requerimientos de la Fase II en el repositorio.

## Solución
Implementado en la versión base (ver historial de commits y capturas del anexo de la Fase II).

## Criterios de aceptación
- [ ] Funciona en la app publicada

**Estimación:** —  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-11 Bitácora de movimientos' --body-file "$CUERPO" --label 'movimientos,versión base')
echo "[23/35] $URL"
gh issue close "$URL" --repo "$REPO" --reason completed --comment 'Implementado en la versión base.' >/dev/null
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Devoluciones. Funcionalidad ya disponible en la versión base de la aplicación.

## Análisis
Se documenta como issue para tener todos los requerimientos de la Fase II en el repositorio.

## Solución
Implementado en la versión base (ver historial de commits y capturas del anexo de la Fase II).

## Criterios de aceptación
- [ ] Funciona en la app publicada

**Estimación:** —  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-12 Devoluciones' --body-file "$CUERPO" --label 'movimientos,versión base')
echo "[24/35] $URL"
gh issue close "$URL" --repo "$REPO" --reason completed --comment 'Implementado en la versión base.' >/dev/null
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Órdenes de cuatro tipos. Funcionalidad ya disponible en la versión base de la aplicación.

## Análisis
Se documenta como issue para tener todos los requerimientos de la Fase II en el repositorio.

## Solución
Implementado en la versión base (ver historial de commits y capturas del anexo de la Fase II).

## Criterios de aceptación
- [ ] Funciona en la app publicada

**Estimación:** —  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-14 Órdenes de cuatro tipos' --body-file "$CUERPO" --label 'órdenes,versión base')
echo "[25/35] $URL"
gh issue close "$URL" --repo "$REPO" --reason completed --comment 'Implementado en la versión base.' >/dev/null
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Código QR por orden y escaneo. Funcionalidad ya disponible en la versión base de la aplicación.

## Análisis
Se documenta como issue para tener todos los requerimientos de la Fase II en el repositorio.

## Solución
Implementado en la versión base (ver historial de commits y capturas del anexo de la Fase II).

## Criterios de aceptación
- [ ] Funciona en la app publicada

**Estimación:** —  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-15 Código QR por orden y escaneo' --body-file "$CUERPO" --label 'órdenes,versión base')
echo "[26/35] $URL"
gh issue close "$URL" --repo "$REPO" --reason completed --comment 'Implementado en la versión base.' >/dev/null
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Firma digital de recibido. Funcionalidad ya disponible en la versión base de la aplicación.

## Análisis
Se documenta como issue para tener todos los requerimientos de la Fase II en el repositorio.

## Solución
Implementado en la versión base (ver historial de commits y capturas del anexo de la Fase II).

## Criterios de aceptación
- [ ] Funciona en la app publicada

**Estimación:** —  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-16 Firma digital de recibido' --body-file "$CUERPO" --label 'órdenes,versión base')
echo "[27/35] $URL"
gh issue close "$URL" --repo "$REPO" --reason completed --comment 'Implementado en la versión base.' >/dev/null
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Autorización obligatoria en regalos. Funcionalidad ya disponible en la versión base de la aplicación.

## Análisis
Se documenta como issue para tener todos los requerimientos de la Fase II en el repositorio.

## Solución
Implementado en la versión base (ver historial de commits y capturas del anexo de la Fase II).

## Criterios de aceptación
- [ ] Funciona en la app publicada

**Estimación:** —  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-17 Autorización obligatoria en regalos' --body-file "$CUERPO" --label 'órdenes,versión base')
echo "[28/35] $URL"
gh issue close "$URL" --repo "$REPO" --reason completed --comment 'Implementado en la versión base.' >/dev/null
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Transferencias a Amazon. Funcionalidad ya disponible en la versión base de la aplicación.

## Análisis
Se documenta como issue para tener todos los requerimientos de la Fase II en el repositorio.

## Solución
Implementado en la versión base (ver historial de commits y capturas del anexo de la Fase II).

## Criterios de aceptación
- [ ] Funciona en la app publicada

**Estimación:** —  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-18 Transferencias a Amazon' --body-file "$CUERPO" --label 'amazon,versión base')
echo "[29/35] $URL"
gh issue close "$URL" --repo "$REPO" --reason completed --comment 'Implementado en la versión base.' >/dev/null
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Ventas y alertas de stock en Amazon. Funcionalidad ya disponible en la versión base de la aplicación.

## Análisis
Se documenta como issue para tener todos los requerimientos de la Fase II en el repositorio.

## Solución
Implementado en la versión base (ver historial de commits y capturas del anexo de la Fase II).

## Criterios de aceptación
- [ ] Funciona en la app publicada

**Estimación:** —  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-19 Ventas y alertas de stock en Amazon' --body-file "$CUERPO" --label 'amazon,versión base')
echo "[30/35] $URL"
gh issue close "$URL" --repo "$REPO" --reason completed --comment 'Implementado en la versión base.' >/dev/null
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Dashboard con alertas de stock mínimo. Funcionalidad ya disponible en la versión base de la aplicación.

## Análisis
Se documenta como issue para tener todos los requerimientos de la Fase II en el repositorio.

## Solución
Implementado en la versión base (ver historial de commits y capturas del anexo de la Fase II).

## Criterios de aceptación
- [ ] Funciona en la app publicada

**Estimación:** —  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-20 Dashboard con alertas de stock mínimo' --body-file "$CUERPO" --label 'reportes,versión base')
echo "[31/35] $URL"
gh issue close "$URL" --repo "$REPO" --reason completed --comment 'Implementado en la versión base.' >/dev/null
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Reportes por periodo. Funcionalidad ya disponible en la versión base de la aplicación.

## Análisis
Se documenta como issue para tener todos los requerimientos de la Fase II en el repositorio.

## Solución
Implementado en la versión base (ver historial de commits y capturas del anexo de la Fase II).

## Criterios de aceptación
- [ ] Funciona en la app publicada

**Estimación:** —  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-21 Reportes por periodo' --body-file "$CUERPO" --label 'reportes,versión base')
echo "[32/35] $URL"
gh issue close "$URL" --repo "$REPO" --reason completed --comment 'Implementado en la versión base.' >/dev/null
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Recibir webhook de pedido pagado de Shopify.

## Análisis
No cabe en el tiempo del proyecto (3 semanas, un desarrollador). Requiere manejar llaves de Shopify en el servidor y verificar firmas HMAC.

## Solución
Fase posterior: endpoint en el backend de Render que reciba el webhook `orders/paid`, verifique la firma y descuente existencias por SKU.

## Criterios de aceptación
- [ ] Queda documentado para una versión futura

**Estimación:** —  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-29 Recibir webhook de pedido pagado de Shopify' --body-file "$CUERPO" --label 'shopify,fuera de alcance v1,prioridad: baja')
echo "[33/35] $URL"
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Descontar stock automáticamente por venta en Shopify.

## Análisis
No cabe en el tiempo del proyecto (3 semanas, un desarrollador). Requiere manejar llaves de Shopify en el servidor y verificar firmas HMAC.

## Solución
Fase posterior: endpoint en el backend de Render que reciba el webhook `orders/paid`, verifique la firma y descuente existencias por SKU.

## Criterios de aceptación
- [ ] Queda documentado para una versión futura

**Estimación:** —  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-30 Descontar stock automáticamente por venta en Shopify' --body-file "$CUERPO" --label 'shopify,fuera de alcance v1,prioridad: baja')
echo "[34/35] $URL"
cat > "$CUERPO" <<'FIN_ISSUE'
## Descripción
Registrar en bitácora los movimientos con origen Shopify.

## Análisis
No cabe en el tiempo del proyecto (3 semanas, un desarrollador). Requiere manejar llaves de Shopify en el servidor y verificar firmas HMAC.

## Solución
Fase posterior: endpoint en el backend de Render que reciba el webhook `orders/paid`, verifique la firma y descuente existencias por SKU.

## Criterios de aceptación
- [ ] Queda documentado para una versión futura

**Estimación:** —  
**Depende de:** —
FIN_ISSUE
URL=$(gh issue create --repo "$REPO" --title 'RF-31 Registrar en bitácora los movimientos con origen Shopify' --body-file "$CUERPO" --label 'shopify,fuera de alcance v1,prioridad: baja')
echo "[35/35] $URL"
rm -f "$CUERPO"
echo 'Listo.'
