FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY target/return-service-1.0.0.jar app.jar

EXPOSE 8008

ENTRYPOINT ["java", "-jar", "app.jar"]
