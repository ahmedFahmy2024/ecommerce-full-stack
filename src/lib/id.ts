const prefixes: Record<string, unknown> = {};

interface GenerateIdOptions {
  length?: number;
  separator?: string;
}

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function generateRandomString(length: number): string {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let result = "";
  for (let i = 0; i < length; i++) {
    result += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return result;
}

export function generateId(
  prefixOrOptions?: keyof typeof prefixes | GenerateIdOptions,
  inputOptions: GenerateIdOptions = {},
) {
  const finalOptions =
    typeof prefixOrOptions === "object" ? prefixOrOptions : inputOptions;

  const prefix =
    typeof prefixOrOptions === "object" ? undefined : prefixOrOptions;

  const { length = 12, separator = "_" } = finalOptions;
  const id = generateRandomString(length);

  return prefix && prefix in prefixes
    ? `${prefixes[prefix]}${separator}${id}`
    : id;
}
