import "dotenv/config";
import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { typeDefs } from "./graphql/schema.js";
import { resolvers } from "./graphql/resolvers.js";

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

// Health check for Render / Docker / uptime monitors
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Root redirect for people who hit / in browser
app.get("/", (_req, res) => {
  res.json({
    message: "Release Checklist API",
    graphql: "/graphql",
    health: "/health",
  });
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
});

await server.start();

app.use(
  "/graphql",
  expressMiddleware(server, {
    context: async ({ req }) => ({ req }),
  })
);

app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`❤️  Health check at http://localhost:${PORT}/health`);
});