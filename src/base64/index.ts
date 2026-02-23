export function isValidBase64(input: string): boolean {
  // Normalize URL-safe base64 to standard base64
  const str = input.replace(/-/g, "+").replace(/_/g, "/");
  return /^[A-Za-z0-9+/]*={0,2}$/.test(str) && str.length % 4 === 0;
}

export function base64Encode(input: string): { output: string } {
  return { output: Buffer.from(input).toString("base64") };
}

export function base64Decode(input: string): { output: string; error?: string } {
  if (!isValidBase64(input)) {
    return { output: "", error: "Invalid base64 string" };
  }
  // Normalize URL-safe base64 before decoding
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  return { output: Buffer.from(normalized, "base64").toString("utf-8") };
}
