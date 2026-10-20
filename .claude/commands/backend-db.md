# Skill: DB Inspector

Cuando el usuario invoque este skill, usá psql para inspeccionar o modificar la base de datos del proyecto.
Leer el `.env` del proyecto para obtener el valor real de `DATABASE_URL` antes de ejecutar.

## Ver tablas
```bash
psql $DATABASE_URL -c "\dt"
```

## Ver columnas de una tabla
```bash
psql $DATABASE_URL -c "\d nombre_tabla"
```

## Contar registros por tabla
```bash
psql $DATABASE_URL -c "SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;"
```

## Consulta ad-hoc
Ejecutá la query que el usuario pida directamente con:
```bash
psql $DATABASE_URL -c "<query>"
```
