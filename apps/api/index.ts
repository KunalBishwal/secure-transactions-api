import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import {
  encryptTransaction,
  decryptTransaction,
  TxSecureRecord
} from "@mirfa/crypto";

dotenv.config();

const app = Fastify();
app.register(cors, { origin: true });

const store = new Map<string, TxSecureRecord>();

const MASTER_KEY = process.env.MASTER_KEY;
if (!MASTER_KEY) {
  throw new Error("MASTER_KEY not set");
}

/**
 * POST /tx/encrypt
 */
app.post("/tx/encrypt", async (request, reply) => {
  try {
    const body = request.body as {
      partyId?: string;
      payload?: unknown;
    };

    if (!body.partyId || !body.payload) {
      return reply.status(400).send({
        error: "partyId and payload are required"
      });
    }

    const record = encryptTransaction(
      body.partyId,
      body.payload,
      MASTER_KEY
    );

    store.set(record.id, record);

    return record;
  } catch (err: any) {
    return reply.status(400).send({
      error: err.message
    });
  }
});

/**
 * GET /tx/:id
 */
app.get("/tx/:id", async (request, reply) => {
  const { id } = request.params as { id: string };

  const record = store.get(id);
  if (!record) {
    return reply.status(404).send({ error: "Not found" });
  }

  return record;
});

/**
 * POST /tx/:id/decrypt
 */
app.post("/tx/:id/decrypt", async (request, reply) => {
  try {
    const { id } = request.params as { id: string };

    const record = store.get(id);
    if (!record) {
      return reply.status(404).send({ error: "Not found" });
    }

    const decrypted = decryptTransaction(record, MASTER_KEY);

    return { decryptedPayload: decrypted };
  } catch (err: any) {
    return reply.status(400).send({
      error: "Decryption failed",
      detail: err.message
    });
  }
});

/**
 * Health
 */
app.get("/health", async () => {
  return { status: "ok" };
});

app.listen({ port: 3001 }, (err) => {
  if (err) throw err;
  console.log("API running on http://localhost:3001");
});
