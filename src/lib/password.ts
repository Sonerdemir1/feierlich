import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export const MIN_PASSWORD_LENGTH = 8;

// Node-eigenes crypto.scrypt statt eines zusaetzlichen npm-Pakets
// (bcrypt/argon2) — bewusst gewaehlt, da scrypt hier fuer die
// ueberschaubare Nutzerzahl voellig ausreicht und keine native
// Kompilierung/zusaetzliche Dependency braucht. Format: "salt:hashHex".
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;

  const hashBuffer = Buffer.from(hashHex, "hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  if (derivedKey.length !== hashBuffer.length) return false;

  // timingSafeEqual statt === — verhindert Timing-Angriffe, die aus der
  // Vergleichsdauer auf richtige/falsche Praefix-Bytes schliessen koennten.
  return timingSafeEqual(derivedKey, hashBuffer);
}
