import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          status: "ok",
          database: "Lovable Cloud",
          timestamp: new Date().toISOString(),
        }),
    },
  },
});
