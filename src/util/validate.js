import { readdir } from "node:fs/promises";

/**
 * Validate options
 *
 * @param  {import("../index.js").Options} options      Options
 * @param  {object}                        releaseInfo  Version specific NW release info
 * @return {Promise<undefined>}                         Return undefined if options are valid
 * @throws {Error}                                         Throw error if options are invalid
 */
export const validate = async (options, releaseInfo) => {
  if (!["get", "run", "build"].includes(options.mode)) {
    throw new Error(
      `Unknown mode ${options.mode}. Expected "get", "run" or "build".`,
    );
  }
  if (typeof releaseInfo === "undefined") {
    throw new Error(
      "Either the specific version info does not exist or the version manifest itself does not exist. In case of the latter, please check your internet connection and try again later.",
    );
  }
  if (!releaseInfo.flavors.includes(options.flavor)) {
    throw new Error(
      `${options.flavor} flavor is not supported by this download server.`,
    );
  }
  if (
    options.platform &&
    options.arch &&
    !releaseInfo.files.includes(`${options.platform}-${options.arch}`)
  ) {
    throw new Error(
      `Platform ${options.platform} and architecture ${options.arch} is not supported by this download server.`,
    );
  }
  // if (typeof options.cacheDir !== "string") {
  //   throw new Error("Expected options.cacheDir to be a string. Got " + typeof options.cacheDir);
  // }
  if (typeof options.cache !== "boolean") {
    return new Error(
      "Expected options.cache to be a boolean. Got " + typeof options.cache,
    );
  }
  if (typeof options.ffmpeg !== "boolean") {
    return new Error(
      "Expected options.ffmpeg to be a boolean. Got " + typeof options.ffmpeg,
    );
  }

  if (
    options.logLevel !== "error" &&
    options.logLevel !== "warn" &&
    options.logLevel !== "info" &&
    options.logLevel !== "debug"
  ) {
    throw new Error(
      "Expected 'error', 'warn', 'info' or 'debug'. Got " + options.logLevel,
    );
  }

  if (options.mode === "get") {
    return undefined;
  }
  if (Array.isArray(options.argv)) {
    return new Error(
      "Expected options.argv to be an array. Got " + typeof options.argv,
    );
  }
  if (typeof options.glob !== "boolean") {
    return new Error(
      "Expected options.glob to be a boolean. Got " + typeof options.glob,
    );
  }

  if (options.srcDir) {
    await readdir(options.srcDir);
  }

  if (options.mode === "run") {
    return undefined;
  }

  if (options.outDir) {
    await readdir(options.outDir);
  }

  // TODO: Validate app options
  return undefined;
};
