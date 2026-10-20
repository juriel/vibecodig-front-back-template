# Skill: DB Inspector

Cuando el usuario invoque este skill, usá el cliente `mysql` para inspeccionar o modificar la base de datos del proyecto (MariaDB/MySQL).
Leer el `.env` del proyecto para obtener `DATABASE_URL` (`mysql+pymysql://user:pass@host/db`) y extraer usuario, contraseña, host y base antes de ejecutar.
Pasar la contraseña con `MYSQL_PWD=<pass>` en vez de `-p` para no exponerla en la línea de comandos.

## Ver tablas
```bash
MYSQL_PWD=<pass> mysql -u <user> -h <host> <db> -e "SHOW TABLES;"
```

## Ver columnas de una tabla
```bash
MYSQL_PWD=<pass> mysql -u <user> -h <host> <db> -e "DESCRIBE nombre_tabla;"
```

## Contar registros por tabla
```bash
MYSQL_PWD=<pass> mysql -u <user> -h <host> <db> -e "SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_rows DESC;"
```

## Consulta ad-hoc
Ejecutá la query que el usuario pida directamente con:
```bash
MYSQL_PWD=<pass> mysql -u <user> -h <host> <db> -e "<query>"
```
