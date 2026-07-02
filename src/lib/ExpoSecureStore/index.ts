import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as aesjs from 'aes-js';
import 'react-native-get-random-values';

// SecureStore has a 2048-byte value limit, so the session JSON is AES-256
// encrypted and stored in AsyncStorage, with the encryption key kept in
// SecureStore.
//
// The key is generated ONCE per storage key and reused across all subsequent
// writes. Generating a new random key on every setItem call created a
// two-step write (SecureStore key write → AsyncStorage ciphertext write) that
// could be interrupted mid-way by backgrounding or a crash, leaving the new
// key in SecureStore but the old ciphertext in AsyncStorage. The next read
// would fail to decrypt (wrong key for old ciphertext) and Supabase would
// silently sign the user out.
export class LargeSecureStore {
  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return encrypted;

    const encryptionKeyHex = await SecureStore.getItemAsync(key);
    if (!encryptionKeyHex) return null;

    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1),
    );
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(encrypted));
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    // Reuse the existing key if one is already stored. Only generate a new
    // key when there is none (first write, or after removeItem). This keeps
    // the SecureStore key and AsyncStorage ciphertext in sync even if the app
    // is backgrounded between the two writes.
    let encryptionKeyHex = await SecureStore.getItemAsync(key);
    if (!encryptionKeyHex) {
      const newKey = crypto.getRandomValues(new Uint8Array(256 / 8));
      encryptionKeyHex = aesjs.utils.hex.fromBytes(newKey);
      await SecureStore.setItemAsync(key, encryptionKeyHex);
    }

    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1),
    );
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await AsyncStorage.setItem(key, aesjs.utils.hex.fromBytes(encryptedBytes));
  }
}
