# Skill: DB Inspector

Cuando el usuario invoque este skill, usá el cliente `mysql` para inspeccionar o modificar la base de datos del proyecto.
Leer el `.env` del proyecto para obtener el valor real de `DATABASE_URL` (`mysql+pymysql://user:pass@host/db`) antes de ejecutar.
No pasar la contraseña por línea de comandos: usar un archivo de opciones con permisos 600 (`[client]` user/password/host) vía `--defaults-extra-file`. En los ejemplos, `$MYCNF` es ese archivo y `<db>` el nombre de la base.

## Ver tablas
```bash
mysql --defaults-extra-file=$MYCNF <db> -e "SHOW TABLES;"
```

## Ver columnas de una tabla
```bash
mysql --defaults-extra-file=$MYCNF <db> -e "SHOW CREATE TABLE nombre_tabla\G"
```

## Contar registros por tabla
```bash
mysql --defaults-extra-file=$MYCNF <db> -e "SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_rows DESC;"
```

## Consulta ad-hoc
Ejecutá la query que el usuario pida directamente con:
```bash
mysql --defaults-extra-file=$MYCNF <db> -e "<query>"
```
