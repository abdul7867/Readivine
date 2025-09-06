import crypto from 'crypto-js';

// Lazy-load the secret key to ensure .env is loaded first
const getSecretKey = () => {
  const secretKey = process.env.CRYPTO_SECRET_KEY;
  if (!secretKey) {
    throw new Error('CRYPTO_SECRET_KEY is not defined in the environment variables.');
  }
  return secretKey;
};

/**
 * Encrypts a given text.
 * @param {string} text The text to encrypt.
 * @returns {string} The encrypted text.
 */
export const encrypt = (text) => {
  if (!text) return null;
  const secretKey = getSecretKey();
  return crypto.AES.encrypt(text, secretKey).toString();
};

/**
 * Decrypts a given hash.
 * @param {string} hash The hash to decrypt.
 * @returns {string} The decrypted text.
 */
export const decrypt = (hash) => {
  if (!hash) return null;
  const secretKey = getSecretKey();
  const bytes = crypto.AES.decrypt(hash, secretKey);
  return bytes.toString(crypto.enc.Utf8);
};
