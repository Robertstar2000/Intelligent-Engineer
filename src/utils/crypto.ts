
// Helper function to convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper function to convert hex string to ArrayBuffer
function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

/**
 * Hashes a password with a random salt using SHA-256.
 * @param password The plaintext password to hash.
 * @returns A promise that resolves to a string containing the salt and hash, separated by a dot.
 */
export async function hashPassword(password: string): Promise<string> {
  // Fallback for non-secure contexts where crypto.subtle might be missing
  if (!window.crypto || !window.crypto.subtle) {
      console.warn("Secure context required for Web Crypto API. Using simple mock hash for insecure dev environment.");
      return `mock_salt.${btoa(password)}`;
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Combine salt and password for hashing
  const saltedData = new Uint8Array(salt.length + data.length);
  saltedData.set(salt);
  saltedData.set(data, salt.length);

  const hashBuffer = await window.crypto.subtle.digest('SHA-256', saltedData);
  
  // Explicitly access .buffer to match type expectation
  const saltHex = bufferToHex(salt.buffer);
  const hashHex = bufferToHex(hashBuffer);

  return `${saltHex}.${hashHex}`;
}

/**
 * Verifies a plaintext password against a stored hash (salt included).
 * @param password The plaintext password to verify.
 * @param storedHash The stored string containing the salt and hash.
 * @returns A promise that resolves to true if the password is correct, false otherwise.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [saltHex, originalHashHex] = storedHash.split('.');
    
    // Handle mock hash from insecure context fallback
    if (saltHex === 'mock_salt') {
        return originalHashHex === btoa(password);
    }

    if (!saltHex || !originalHashHex) {
      return false; // Invalid hash format
    }

    if (!window.crypto || !window.crypto.subtle) {
         console.warn("Secure context required for Web Crypto API. Cannot verify real hash in insecure environment.");
         return false;
    }

    const salt = hexToBuffer(saltHex);
    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    // Combine salt and password for hashing
    const saltedData = new Uint8Array(salt.byteLength + data.length);
    saltedData.set(new Uint8Array(salt));
    saltedData.set(data, salt.byteLength);

    const hashBuffer = await window.crypto.subtle.digest('SHA-256', saltedData);
    const hashHex = bufferToHex(hashBuffer);

    return hashHex === originalHashHex;
  } catch (error) {
    console.error("Error during password verification:", error);
    return false;
  }
}

export function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
