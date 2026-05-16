# ─────────────────────────────────────────────
# Stage 1 – Resolve & cache Maven dependencies
# ─────────────────────────────────────────────
FROM maven:3.9.15-eclipse-temurin-25 AS deps
WORKDIR /app

COPY pom.xml .

RUN mvn dependency:go-offline -B

# ─────────────────────────────────────────────
# Stage 2 – Compile & package the application
# ─────────────────────────────────────────────
FROM maven:3.9.15-eclipse-temurin-25 AS build
WORKDIR /app

COPY --from=deps /root/.m2 /root/.m2
COPY --from=deps /app/pom.xml .
COPY src src

RUN mvn package -DskipTests -B

# ─────────────────────────────────────────────
# Stage 3 – Minimal JRE runtime (least privilege)
# ─────────────────────────────────────────────
FROM eclipse-temurin:25-jre AS runtime


RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup --no-create-home appuser && \
    apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build --chown=appuser:appgroup /app/target/iotmonitoring-0.0.1-SNAPSHOT.jar app.jar

USER appuser

EXPOSE 8080

CMD ["java", \
     "-Djava.security.egd=file:/dev/./urandom", \
     "-jar", "app.jar"]
