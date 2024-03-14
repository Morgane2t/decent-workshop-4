import { webcrypto } from "crypto";

// #############
// ### Utils ###
// #############

// Function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

// Function to convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  var buff = Buffer.from(base64, "base64");
  return buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
}

// ################
// ### RSA keys ###
// ################

// Generates a pair of private / public RSA keys
type GenerateRsaKeyPair = {
  publicKey: webcrypto.CryptoKey;
  privateKey: webcrypto.CryptoKey;
};
export async function generateRsaKeyPair(): Promise<GenerateRsaKeyPair> {
  const keyPair = await webcrypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
  return keyPair;

  //return { publicKey: {} as any, privateKey: {} as any };
}

// Export a crypto public key to a base64 string format
export async function exportPubKey(key: webcrypto.CryptoKey): Promise<string> {
  const exportedKey = await webcrypto.subtle.exportKey("spki", key);
  return arrayBufferToBase64(exportedKey);
  //return "";
}

// Export a crypto private key to a base64 string format
export async function exportPrvKey(
  key: webcrypto.CryptoKey | null
): Promise<string | null> {
  if (key) {
    const exportedKey = await webcrypto.subtle.exportKey("pkcs8", key);
    return arrayBufferToBase64(exportedKey);
  }
  return null;
  //return "";
}

// Import a base64 string public key to its native format
export async function importPubKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  const importedKey = await webcrypto.subtle.importKey(
    "spki",
    base64ToArrayBuffer(strKey),
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
  return importedKey;
  //return {} as any;
}

// Import a base64 string private key to its native format
export async function importPrvKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  const importedKey = await webcrypto.subtle.importKey(
    "pkcs8",
    base64ToArrayBuffer(strKey),
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
  return importedKey;
  //return {} as any;
}

// Encrypt a message using an RSA public key
export async function rsaEncrypt(
  b64Data: string,
  strPublicKey: string
): Promise<string> {
  const pubKey = await importPubKey(strPublicKey);
  const encryptedData = await webcrypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    pubKey,
    base64ToArrayBuffer(b64Data)
  );
  return arrayBufferToBase64(encryptedData);
}

// Decrypts a message using an RSA private key
export async function rsaDecrypt(
  data: string,
  privateKey: webcrypto.CryptoKey
): Promise<string> {
  const decryptedData = await webcrypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    base64ToArrayBuffer(data)
  );
  return arrayBufferToBase64(decryptedData);
  //return "";
}

// ######################
// ### Symmetric keys ###
// ######################

// Generates a random symmetric key
export async function createRandomSymmetricKey(): Promise<webcrypto.CryptoKey> {
  const key = await webcrypto.subtle.generateKey(
    {
      name: "AES-CBC",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
  return key;
  //return {} as any;
}

// Export a crypto symmetric key to a base64 string format
export async function exportSymKey(key: webcrypto.CryptoKey): Promise<string> {
  const exportedKey = await webcrypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(exportedKey);
  //return "";
}

// Import a base64 string format to its crypto native format
export async function importSymKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  const importedKey = await webcrypto.subtle.importKey(
    "raw",
    base64ToArrayBuffer(strKey),
    {
      name: "AES-CBC",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
  return importedKey;
  //return {} as any;
}

// Encrypt a message using a symmetric key
export async function symEncrypt(
  key: webcrypto.CryptoKey,
  data: string
): Promise<string> {
  const encodedData = new TextEncoder().encode(data);
  const iv = webcrypto.getRandomValues(new Uint8Array(16));
  const encryptedData = await webcrypto.subtle.encrypt(
    { name: "AES-CBC", iv: iv },
    key,
    encodedData
  );
  const ivAndEncryptedData = new Uint8Array(iv.length + encryptedData.byteLength);
  ivAndEncryptedData.set(iv, 0);
  ivAndEncryptedData.set(new Uint8Array(encryptedData), iv.length);
  return arrayBufferToBase64(ivAndEncryptedData.buffer);
  //return "";
}

// Decrypt a message using a symmetric key
export async function symDecrypt(
  strKey: string,
  encryptedData: string
): Promise<string> {
  //const [iv, data] = encryptedData.split(":").map(base64ToArrayBuffer);
  const ivAndEncryptedData = new Uint8Array(base64ToArrayBuffer(encryptedData));
  const key = await importSymKey(strKey);
  const data = ivAndEncryptedData.slice(16);
  const decryptedData = await webcrypto.subtle.decrypt(
    { name: "AES-CBC", iv: ivAndEncryptedData.slice(0, 16)},
    key,
    data
  );
  return new TextDecoder().decode(decryptedData);
  //return "";
}
