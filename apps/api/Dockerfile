# Build: compile and package the API. Tests run in CI, where Docker-in-Docker is available.
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src src
RUN mvn -B -q -DskipTests package && cp target/devs-api-*.jar /api.jar

# Run: JRE only, as an unprivileged user with nothing writable except the local storage folder.
FROM eclipse-temurin:25-jre-noble
RUN useradd --system --uid 10001 --no-create-home api \
 && mkdir -p /app /data/storage \
 && chown api /data/storage
COPY --from=build /api.jar /app/api.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/api.jar"]
