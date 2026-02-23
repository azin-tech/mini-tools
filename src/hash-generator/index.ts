import { createHash } from "node:crypto";

export type HashAlgorithm = "md5" | "sha1" | "sha256" | "sha512";

export interface HashResult {
  hash: string;
  algorithm: HashAlgorithm;
}

const SUPPORTED_ALGORITHMS: readonly HashAlgorithm[] = ["md5", "sha1", "sha256", "sha512"];

/**
 * Generate a hex-encoded hash of the input string using the specified algorithm.
 *
 * @param input - The string to hash
 * @param algorithm - One of "md5", "sha1", "sha256", "sha512"
 * @returns HashResult with the hex digest and algorithm used, or an error object
 */
export function generateHash(
  input: string,
  algorithm: HashAlgorithm
): HashResult | { error: string } {
  if (!SUPPORTED_ALGORITHMS.includes(algorithm)) {
    return {
      error: `Unsupported algorithm "${algorithm}". Supported: ${SUPPORTED_ALGORITHMS.join(", ")}`,
    };
  }

  try {
    const hash = createHash(algorithm).update(input, "utf-8").digest("hex");
    return { hash, algorithm };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: `Failed to generate hash: ${message}` };
  }
}
