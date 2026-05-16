# ─────────────────────────────────────────────
# MySQL Database Image
# ─────────────────────────────────────────────
FROM mysql:9.7

COPY schema.sql /docker-entrypoint-initdb.d/01-schema.sql

EXPOSE 3306