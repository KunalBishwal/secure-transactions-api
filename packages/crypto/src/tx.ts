import crypto from "node:crypto";
import { TxSecureRecord } from "./types";
import {
  generateDEK,
  encryptAESGCM,
  decryptAESGCM
} from "./encryption";
import { isValidHex, assertLength } from "./utils";

const DEK_LENGTH = 32;
const MASTER_KEY_LENGTH = 32;

function generateId(): string {
  return crypto.randomUUID();
}

function toHex(buffer: Buffer): string {
  return buffer.toString("hex");
}

function fromHex(hex: string): Buffer {
  if (!isValidHex(hex)) {
    throw new Error("Invalid hex string");
  }
  return Buffer.from(hex, "hex");
}

export function encryptTransaction(
  partyId: string,
  payload: unknown,
  masterKeyHex: string
): TxSecureRecord {
  const masterKey = fromHex(masterKeyHex);
  assertLength(masterKey, MASTER_KEY_LENGTH, "Master key");

  const dek = generateDEK();
  assertLength(dek, DEK_LENGTH, "DEK");

  const payloadBuffer = Buffer.from(JSON.stringify(payload));

  // Encrypt payload using DEK
  const payloadEnc = encryptAESGCM(dek, payloadBuffer);

  // Wrap DEK using master key
  const dekWrap = encryptAESGCM(masterKey, dek);

  return {
    id: generateId(),
    partyId,
    createdAt: new Date().toISOString(),

    payload_nonce: toHex(payloadEnc.nonce),
    payload_ct: toHex(payloadEnc.ciphertext),
    payload_tag: toHex(payloadEnc.tag),

    dek_wrap_nonce: toHex(dekWrap.nonce),
    dek_wrapped: toHex(dekWrap.ciphertext),
    dek_wrap_tag: toHex(dekWrap.tag),

    alg: "AES-256-GCM",
    mk_version: 1
  };
}

export function decryptTransaction(
  record: TxSecureRecord,
  masterKeyHex: string
): unknown {
  const masterKey = fromHex(masterKeyHex);
  assertLength(masterKey, MASTER_KEY_LENGTH, "Master key");

  const dekWrapNonce = fromHex(record.dek_wrap_nonce);
  const dekWrapped = fromHex(record.dek_wrapped);
  const dekWrapTag = fromHex(record.dek_wrap_tag);

  const payloadNonce = fromHex(record.payload_nonce);
  const payloadCt = fromHex(record.payload_ct);
  const payloadTag = fromHex(record.payload_tag);

  // Unwrap DEK
  const dek = decryptAESGCM(
    masterKey,
    dekWrapNonce,
    dekWrapped,
    dekWrapTag
  );

  assertLength(dek, DEK_LENGTH, "Unwrapped DEK");

  // Decrypt payload
  const decryptedBuffer = decryptAESGCM(
    dek,
    payloadNonce,
    payloadCt,
    payloadTag
  );

  return JSON.parse(decryptedBuffer.toString("utf-8"));
}
