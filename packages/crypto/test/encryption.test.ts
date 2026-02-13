import { describe, it, expect } from "vitest";
import {
  encryptTransaction,
  decryptTransaction
} from "../src/encryption";

describe("Envelope Encryption", () => {

  it("encrypt → decrypt works", () => {
    const payload = { amount: 100 };

    const record = encryptTransaction(
      "party_1",
      payload
    );

    const decrypted =
      decryptTransaction(record);

    expect(decrypted).toEqual(payload);
  });

  it("tampered ciphertext fails", () => {
    const payload = { amount: 100 };

    const record = encryptTransaction(
      "party_1",
      payload
    );

    record.payload_ct =
      "00" + record.payload_ct.slice(2);

    expect(() =>
      decryptTransaction(record)
    ).toThrow();
  });

  it("tampered tag fails", () => {
    const payload = { amount: 100 };

    const record = encryptTransaction(
      "party_1",
      payload
    );

    record.payload_tag =
      "00" + record.payload_tag.slice(2);

    expect(() =>
      decryptTransaction(record)
    ).toThrow();
  });

});
