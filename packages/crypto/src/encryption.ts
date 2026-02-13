import crypto from "node:crypto";
import { assertLength } from "./utils";

const NONCE_LENGTH = 12;
const TAG_LENGTH = 16;
const DEK_LENGTH = 32;


export function generateDEK(): Buffer {
  return crypto.randomBytes(DEK_LENGTH);
}

export function encryptAESGCM(
  key: Buffer,
  plaintext: Buffer
) {
  const nonce = crypto.randomBytes(NONCE_LENGTH);

  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    key,
    nonce
  );

  const ciphertext = Buffer.concat([
    cipher.update(plaintext),
    cipher.final()
  ]);

  const tag = cipher.getAuthTag();

  return { nonce, ciphertext, tag };
}

export function decryptAESGCM(
  key: Buffer,
  nonce: Buffer,
  ciphertext: Buffer,
  tag: Buffer
) {
  assertLength(nonce, NONCE_LENGTH, "Nonce");
  assertLength(tag, TAG_LENGTH, "Auth tag");

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    nonce
  );

  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);
}


const MASTER_KEY = Buffer.from(
  process.env.MASTER_KEY!,
  "hex"
);
if (MASTER_KEY.length !== 32) {
  throw new Error("MASTER_KEY must be 32 bytes (64 hex chars)");
}

export type TxSecureRecord = {
  id: string;
  partyId: string;
  createdAt: string;

  payload_nonce: string;
  payload_ct: string;
  payload_tag: string;

  dek_wrap_nonce: string;
  dek_wrapped: string;
  dek_wrap_tag: string;

  alg: "AES-256-GCM";
  mk_version: 1;
};

export function encryptTransaction(
  partyId: string,
  payload: unknown
): TxSecureRecord {
  const dek = generateDEK();

  const payloadBuffer = Buffer.from(
    JSON.stringify(payload)
  );

  const payloadEnc = encryptAESGCM(
    dek,
    payloadBuffer
  );

  const dekEnc = encryptAESGCM(
    MASTER_KEY,
    dek
  );

  return {
    id: crypto.randomUUID(),
    partyId,
    createdAt: new Date().toISOString(),

    payload_nonce: payloadEnc.nonce.toString("hex"),
    payload_ct: payloadEnc.ciphertext.toString("hex"),
    payload_tag: payloadEnc.tag.toString("hex"),

    dek_wrap_nonce: dekEnc.nonce.toString("hex"),
    dek_wrapped: dekEnc.ciphertext.toString("hex"),
    dek_wrap_tag: dekEnc.tag.toString("hex"),

    alg: "AES-256-GCM",
    mk_version: 1
  };
}

export function decryptTransaction(
  record: TxSecureRecord
) {
  const dek = decryptAESGCM(
    MASTER_KEY,
    Buffer.from(record.dek_wrap_nonce, "hex"),
    Buffer.from(record.dek_wrapped, "hex"),
    Buffer.from(record.dek_wrap_tag, "hex")
  );

  const payloadBuffer = decryptAESGCM(
    dek,
    Buffer.from(record.payload_nonce, "hex"),
    Buffer.from(record.payload_ct, "hex"),
    Buffer.from(record.payload_tag, "hex")
  );

  return JSON.parse(payloadBuffer.toString());
}
