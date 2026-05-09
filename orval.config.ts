import { defineConfig } from "orval";

declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  ges: {
    input: {
      // Spring Boot: server.servlet.context-path=/api, springdoc path=/v3/api-docs
      target: process.env.GES_OPENAPI_URL || "http://localhost:8080/api/v3/api-docs",
      validation: false,
    },
    output: {
      // Keep generated code in its own folder so `clean: true`
      // doesn't delete hand-written helpers like `lib/api/errors.ts`.
      target: "./lib/api/generated/index.ts",
      client: "fetch",
      mode: "single",
      clean: true,
      prettier: true,
      override: {},
    },
  },
});

