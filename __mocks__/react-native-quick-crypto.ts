export default {
  subtle: {
    generateKey: async () => ({}),
    exportKey: async () => new ArrayBuffer(0),
    importKey: async () => ({}),
    encrypt: async () => new ArrayBuffer(0),
    decrypt: async () => new ArrayBuffer(0),
  },
};
