// A safer way to detect the environment
export const isServer = () =>
  typeof process !== "undefined" &&
  process.versions !== undefined &&
  process.versions.node !== undefined;

export const isClient = () => !isServer();
