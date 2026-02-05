// Secure password hashing using Web Crypto API
// This provides proper cryptographic hashing for capsule passwords

/**
 * Hash a password using SHA-256 with a salt
 * Note: For maximum security, this should be done server-side with bcrypt
 * This client-side approach provides reasonable security for capsule passwords
 */
export async function hashPassword(password: string): Promise<string> {
  // Create a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Encode the password with salt
  const encoder = new TextEncoder();
  const data = encoder.encode(saltHex + password);
  
  // Hash using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Return salt + hash combined
  return `${saltHex}:${hashHex}`;
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [saltHex, expectedHash] = storedHash.split(':');
    
    if (!saltHex || !expectedHash) {
      // Legacy format (base64) - for backwards compatibility
      return btoa(password) === storedHash;
    }
    
    // Encode the password with the stored salt
    const encoder = new TextEncoder();
    const data = encoder.encode(saltHex + password);
    
    // Hash using SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex === expectedHash;
  } catch {
    return false;
  }
}
