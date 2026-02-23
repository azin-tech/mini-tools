export interface JwtPayload {
  [key: string]: unknown;
}

export interface JwtDecodeResult {
  header: JwtPayload;
  payload: JwtPayload;
  signature: string;
  isExpired?: boolean;
  /** ISO date string of the `exp` claim */
  expiresAt?: string;
}

function base64UrlDecode(input: string): string {
  // Replace URL-safe characters and add padding
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64").toString("utf-8");
}

/**
 * Decode a JSON Web Token (JWT) without verifying the signature.
 *
 * WARNING: This does not verify the signature. Do not use the decoded payload
 * for security decisions without proper verification.
 *
 * @param token - The raw JWT string (three base64url parts separated by dots)
 * @returns JwtDecodeResult with decoded header, payload, and signature info, or an error object
 */
export function decodeJwt(token: string): JwtDecodeResult | { error: string } {
  if (typeof token !== "string" || token.trim() === "") {
    return { error: "Token must be a non-empty string" };
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return { error: "Invalid JWT: must have exactly 3 parts separated by dots" };
  }

  const [headerPart, payloadPart, signaturePart] = parts;

  let header: JwtPayload;
  try {
    header = JSON.parse(base64UrlDecode(headerPart));
  } catch {
    return { error: "Invalid JWT: failed to decode header" };
  }

  let payload: JwtPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadPart));
  } catch {
    return { error: "Invalid JWT: failed to decode payload" };
  }

  const result: JwtDecodeResult = {
    header,
    payload,
    signature: signaturePart,
  };

  // Check exp claim
  if (typeof payload.exp === "number") {
    const expiresAt = new Date(payload.exp * 1000);
    result.expiresAt = expiresAt.toISOString();
    result.isExpired = Date.now() > payload.exp * 1000;
  }

  return result;
}
