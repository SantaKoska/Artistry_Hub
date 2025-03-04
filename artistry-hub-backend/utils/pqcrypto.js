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

// Encrypt data using Kyber
async function encrypt(data, publicKey) {
  try {
    const plaintext = Buffer.from(data, "utf8"); // Convert data to Buffer
    let c_ss = kyber.Encrypt768(Buffer.from(publicKey, "base64"), plaintext); // Encrypt using public key
    let ciphertext = c_ss[0];
    let sharedSecret = c_ss[1];

    // Log the encrypted data and other parameters
    // console.log("Encrypted Data:", ciphertext.toString("base64"));

    // Store the encrypted data in the package
    return {
      encryptedData: ciphertext.toString("base64"),
    };
  } catch (error) {
    console.error("Error encrypting data:", error);
    throw error;
  }
}

// Decrypt data using Kyber
async function decrypt(encryptedPackage, privateKey) {
  try {
    // Ensure encryptedData is a string
    if (typeof encryptedPackage.encryptedData !== "string") {
      throw new TypeError("encryptedData must be a string");
    }

    const encryptedData = Buffer.from(encryptedPackage.encryptedData, "base64");

    // Decapsulate data using Kyber
    const sharedSecret = kyber.Decrypt768(
      encryptedData,
      Buffer.from(privateKey, "base64")
    ); // Obtain the symmetric key

    // Convert the decrypted data to a string if it's a Buffer
    return sharedSecret.toString("utf8"); // Ensure the decrypted data is returned as a string
  } catch (error) {
    console.error("Error decrypting data:", error);
    console.error(error.stack);
    throw error;
  }
}

module.exports = {
  createKeyPair,
  encrypt,
  decrypt,
};
