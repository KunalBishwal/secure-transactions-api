import Fastify from "fastify";
import cors from "@fastify/cors";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { encryptTransaction, decryptTransaction } from "@mirfa/crypto";
import crypto from "node:crypto";

const MASTER_KEY = Buffer.from(process.env.MASTER_KEY!, "hex");

const app = Fastify();

app.register(cors, { origin: true });

const store = new Map<string, any>();

app.get("/health", async () => {
  return { status: "ok" };
});

app.post("/tx/encrypt", async (request, reply) => {
  const { partyId, payload } = request.body as any;

  const record = encryptTransaction(partyId, payload);
  store.set(record.id, record);

  return record;
});

app.get("/tx/:id", async (request, reply) => {
  const { id } = request.params as any;

  const record = store.get(id);
  if (!record) return reply.status(404).send({ error: "Not found" });

  return record;
});

app.post("/tx/:id/decrypt", async (request, reply) => {
  const { id } = request.params as any;

  const record = store.get(id);
  if (!record) return reply.status(404).send({ error: "Not found" });

  const decrypted = decryptTransaction(record);

  return decrypted;
});

// 🚀 This is the important part:
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  await app.ready();
  app.server.emit("request", req, res);
}
