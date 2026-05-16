# ─────────────────────────────────────────────
# Single Stage – Build AND Run
# ─────────────────────────────────────────────
FROM maven:3.9.15-eclipse-temurin-25

# Setup restricted user
RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup --no-create-home appuser && \
    apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy source code and POM
COPY pom.xml .
COPY src src

# Compile the application
RUN mvn package -DskipTests -B

# Change ownership of the compiled JAR
RUN chown appuser:appgroup /app/target/iotmonitoring-0.0.1-SNAPSHOT.jar

USER appuser

EXPOSE 8080

# Run the application directly from the target folder
CMD ["java", \
     "-Djava.security.egd=file:/dev/./urandom", \
     "-jar", "/app/target/iotmonitoring-0.0.1-SNAPSHOT.jar"]
