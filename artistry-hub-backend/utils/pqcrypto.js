const kyber = require("crystals-kyber");
const crypto = require("crypto");

// Generate PQ-safe key pair using Kyber
async function createKeyPair() {
  try {
    let [publicKey, privateKey] = kyber.KeyGen768(); // Correct Kyber key generation

    return {
      publicKey: Buffer.from(publicKey).toString("base64"),
      privateKey: Buffer.from(privateKey).toString("base64"),
    };
  } catch (error) {
    console.error("Error generating PQ keypair:", error);
    throw error;
  }
}

// Encrypt data using Kyber + AES (Hybrid Encryption)
async function encrypt(data, publicKey) {
  try {
    const aesKey = crypto.randomBytes(32); // Generate a random 256-bit AES key
    const iv = crypto.randomBytes(12);

    // Encrypt the data using AES-GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
    let encryptedData = cipher.update(data, "utf8", "base64");
    encryptedData += cipher.final("base64");
    const authTag = cipher.getAuthTag();

    // Encapsulate AES key using Kyber
    let [ciphertext, sharedSecret] = kyber.Encrypt768(
      Buffer.from(publicKey, "base64")
    );

    return {
      encryptedData,
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      encryptedKey: ciphertext.toString("base64"), // The PQ-encrypted AES key
    };
  } catch (error) {
    console.error("Error encrypting data:", error);
    throw error;
  }
}

// Decrypt data using Kyber + AES
async function decrypt(encryptedPackage, privateKey) {
  try {
    const encryptedKey = Buffer.from(encryptedPackage.encryptedKey, "base64");
    const iv = Buffer.from(encryptedPackage.iv, "base64");
    const authTag = Buffer.from(encryptedPackage.authTag, "base64");

    // Decapsulate AES key using Kyber
    const sharedSecret = kyber.Decrypt768(
      encryptedKey,
      Buffer.from(privateKey, "base64")
    );

    // Decrypt the data using AES-GCM
    const decipher = crypto.createDecipheriv("aes-256-gcm", sharedSecret, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(
      encryptedPackage.encryptedData,
      "base64",
      "utf8"
    );
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Error decrypting data:", error);
    throw error;
  }
}

module.exports = {
  createKeyPair,
  encrypt,
  decrypt,
};
