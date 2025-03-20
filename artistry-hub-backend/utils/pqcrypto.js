const kyber = require("crystals-kyber");
const crypto = require("crypto");

// Generate PQ-safe key pair using Kyber
async function createKeyPair() {
  try {
    let pk_sk = kyber.KeyGen768(); // Generate public and private key pair
    let publicKey = pk_sk[0];
    let privateKey = pk_sk[1];

    return {
      publicKey: Buffer.from(publicKey).toString("base64"),
      privateKey: Buffer.from(privateKey).toString("base64"),
    };
  } catch (error) {
    console.error("Error generating PQ keypair:", error);
    throw error;
  }
}

// Encrypt data using Kyber + AES
async function encrypt(data, publicKey) {
  try {
    // First, use Kyber to generate a shared secret
    let c_ss = kyber.Encrypt768(Buffer.from(publicKey, "base64"));
    let ciphertext = c_ss[0];
    let sharedSecret = c_ss[1];

    // Derive an AES key from the shared secret using HKDF
    const aesKey = crypto.createHash("sha256").update(sharedSecret).digest();
    const iv = crypto.randomBytes(16);

    // Create AES cipher and encrypt the actual data
    const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
    let encryptedData = cipher.update(data, "utf8", "base64");
    encryptedData += cipher.final("base64");
    const authTag = cipher.getAuthTag();

    return {
      encryptedData: encryptedData,
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      encapsulatedKey: ciphertext.toString("base64"),
    };
  } catch (error) {
    console.error("Error encrypting data:", error);
    throw error;
  }
}

// Decrypt data using Kyber + AES
async function decrypt(encryptedPackage, privateKey) {
  try {
    const { encryptedData, iv, authTag, encapsulatedKey } = encryptedPackage;

    // First, recover the shared secret using Kyber
    const sharedSecret = kyber.Decrypt768(
      Buffer.from(encapsulatedKey, "base64"),
      Buffer.from(privateKey, "base64")
    );

    // Derive the same AES key from the shared secret
    const aesKey = crypto.createHash("sha256").update(sharedSecret).digest();

    // Create decipher and decrypt the data
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      aesKey,
      Buffer.from(iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(authTag, "base64"));

    let decryptedData = decipher.update(encryptedData, "base64", "utf8");
    decryptedData += decipher.final("utf8");

    return decryptedData;
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
