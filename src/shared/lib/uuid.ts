function generateFallbackUUID() {
  const template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  let seed = Date.now() + Math.floor(Math.random() * 0x100000000);

  return template.replace(/[xy]/g, (character) => {
    seed = (seed * 1664525 + 1013904223) % 0x100000000;
    const random = seed & 0xf;
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function safeUUID() {
  const cryptoObject = globalThis.crypto;

  if (cryptoObject && typeof cryptoObject.randomUUID === "function") {
    return cryptoObject.randomUUID();
  }

  return generateFallbackUUID();
}
