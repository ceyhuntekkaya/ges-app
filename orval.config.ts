import { defineConfig } from "orval";

export default defineConfig({
  ges: {
    input: {
      // Spring Boot: server.servlet.context-path=/api, springdoc path=/v3/api-docs
      target: process.env.GES_OPENAPI_URL || "http://localhost:8080/api/v3/api-docs",
      validation: false,
    },
    output: {
      target: "./lib/api/generated.ts",
      client: "fetch",
      mode: "single",
      clean: true,
      prettier: true,
      override: {},
    },
  },
});

