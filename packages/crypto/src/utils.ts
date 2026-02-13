export function isValidHex(hex: string): boolean {
  return /^[0-9a-fA-F]+$/.test(hex);
}

export function assertLength(buffer: Buffer, length: number, name: string) {
  if (buffer.length !== length) {
    throw new Error(`${name} must be ${length} bytes`);
  }
}
