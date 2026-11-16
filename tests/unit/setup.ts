import "@testing-library/jest-dom/vitest";
import { config } from "dotenv";
import { vi } from "vitest";

config({ path: ".env" });

vi.mock("server-only", () => ({}));

// In jsdom environment, Buffers from Node don't pass `instanceof Uint8Array` across realms,
// causing pdfkit to treat image Buffers as file paths and call readFileSync.
if (typeof Uint8Array !== "undefined") {
  const orig = Uint8Array[Symbol.hasInstance];
  Object.defineProperty(Uint8Array, Symbol.hasInstance, {
    value: (instance: unknown) => {
      return (
        Buffer.isBuffer(instance) || (orig ? orig.call(Uint8Array, instance) : false)
      );
    },
    configurable: true,
  });
}
