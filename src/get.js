import { createWriteStream } from "node:fs";

import { mkdir, readdir, rm, rmdir } from "node:fs/promises";
import { get as getRequest } from "node:https";
import { resolve } from "node:path";
import { arch as ARCH, platform as PLATFORM } from "node:process";

import progress from "cli-progress";
import compressing from "compressing";

const PLATFORM_KV = {
  darwin: "osx",
  linux: "linux",
  win32: "win",
};

const ARCH_KV = {
  x64: "x64",
  ia32: "ia32",
  arm64: "arm64",
};

/**
 * _Note: This an internal function which is not called directly. Please see example usage below._
 *
 * Get NW.js binaries.
 *
 * @example
 * // Minimal Usage (uses default values)
 * nwbuild({
 *   mode: "get",
 * });
 *
 * @example
 * // Unofficial MacOS builds (upto v0.75.0)
 * nwbuild({
 *   mode: "get",
 *   platform: "osx",
 *   arch: "arm64",
 *   downloadUrl: "https://github.com/corwin-of-amber/nw.js/releases/download",
 *   manifestUrl: "https://raw.githubusercontent.com/nwutils/nw-builder/main/src/util/osx.arm.versions.json",
 * });
 *
 * @example
 * // China mirror
 * nwbuild({
 *  mode: "get",
 *  downloadUrl: "https://npm.taobao.org/mirrors/nwjs",
 * });
 *
 * @example
 * // Singapore mirror
 * nwbuild({
 *  mode: "get",
 *  downloadUrl: "https://cnpmjs.org/mirrors/nwjs/",
 * });
 * 
 * @example
 * // FFmpeg (proprietary codecs)
 * // Please read the license's constraints: https://nwjs.readthedocs.io/en/latest/For%20Developers/Enable%20Proprietary%20Codecs/#get-ffmpeg-binaries-from-the-community
 * nwbuild({
 *   mode: "get",
 *   ffmpeg: true,
 * });
 *
 * @param  {object}                   options              Get mode options
 * @param  {string}                   options.version      NW.js runtime version. Defaults to "latest".
 * @param  {"normal" | "sdk"}         options.flavor       NW.js build flavor. Defaults to "normal".
 * @param  {"linux" | "osx" | "win"}  options.platform     Target platform. Defaults to host platform.
 * @param  {"ia32" | "x64" | "arm64"} options.arch         Target architecture. Defaults to host architecture.
 * @param  {string}                   options.downloadUrl  File server to download from. Defaults to "https://dl.nwjs.io". Set "https://npm.taobao.org/mirrors/nwjs" for China mirror or "https://cnpmjs.org/mirrors/nwjs/" for Singapore mirror.
 * @param  {string}                   options.cacheDir     Cache directory path. Defaults to "./cache"
 * @param  {boolean}                  options.cache        If false, remove cache before download. Defaults to true.
 * @param  {boolean}                  options.ffmpeg       If true, download ffmpeg. Defaults to false since it contains proprietary codecs. Please read the license's constraints: https://nwjs.readthedocs.io/en/latest/For%20Developers/Enable%20Proprietary%20Codecs/#get-ffmpeg-binaries-from-the-community
 * @return {Promise<void>}
 */
export async function get({
  version = "latest",
  flavor = "normal",
  platform = PLATFORM_KV[PLATFORM],
  arch = ARCH_KV[ARCH],
  downloadUrl = "https://dl.nwjs.io",
  cacheDir = "./cache",
  cache = true,
  ffmpeg = false,
}) {
  let nwCached = true;
  const nwDir = resolve(
    cacheDir,
    `nwjs${flavor === "sdk" ? "-sdk" : ""}-v${version}-${platform}-${arch}`,
  );
  let out = undefined;
  let url = undefined;
  const bar = new progress.SingleBar({}, progress.Presets.rect);

  // Set download url and destination.
  if (
    downloadUrl === "https://dl.nwjs.io" ||
    downloadUrl === "https://npm.taobao.org/mirrors/nwjs" ||
    downloadUrl === "https://npmmirror.com/mirrors/nwjs"
  ) {
    url = `${downloadUrl}/v${version}/nwjs${
      flavor === "sdk" ? "-sdk" : ""
    }-v${version}-${platform}-${arch}.${
      platform === "linux" ? "tar.gz" : "zip"
    }`;
    out = resolve(cacheDir, `nw.${platform === "linux" ? "tgz" : "zip"}`);
  }

  // If options.ffmpeg is true, then download ffmpeg.
  if (ffmpeg === true) {
    downloadUrl =
      "https://github.com/nwjs-ffmpeg-prebuilt/nwjs-ffmpeg-prebuilt/releases/download";
    url = `${downloadUrl}/${version}/${version}-${platform}-${arch}.zip`;
    out = resolve(cacheDir, `ffmpeg.zip`);
  }

  // If options.cache is false, remove cache.
  if (cache === false) {
    rmdir(nwDir, { recursive: true, force: true });
  }

  // Check if cache exists.
  try {
    await readdir(nwDir);
  } catch (error) {
    nwCached = false;
  }

  // If not cached, then download.
  if (nwCached === false) {
    await mkdir(nwDir, { recursive: true });

    const stream = createWriteStream(out);
    const request = new Promise((resolve, reject) => {
      getRequest(url, (response) => {
        // For GitHub releases and mirrors, we need to follow the redirect.
        if (
          downloadUrl ===
            "https://github.com/nwjs-ffmpeg-prebuilt/nwjs-ffmpeg-prebuilt/releases/download" ||
          downloadUrl === "https://npm.taobao.org/mirrors/nwjs" ||
          downloadUrl === "https://npmmirror.com/mirrors/nwjs"
        ) {
          url = response.headers.location;
        }

        getRequest(url, (response) => {
          let chunks = 0;
          bar.start(Number(response.headers["content-length"]), 0);
          response.on("data", async (chunk) => {
            chunks += chunk.length;
            bar.increment();
            bar.update(chunks);
          });

          response.on("error", (error) => {
            reject(error);
          });

          response.on("end", () => {
            bar.stop();
            if (platform === "linux") {
              compressing.tgz
                .uncompress(out, ffmpeg ? nwDir : cacheDir)
                .then(() => resolve());
            } else {
              compressing.zip
                .uncompress(out, ffmpeg ? nwDir : cacheDir)
                .then(() => resolve());
            }
          });

          response.pipe(stream);
        });

        response.on("error", (error) => {
          reject(error);
        });
      });
    });

    // Remove compressed file after download and decompress.
    request.then(async () => {
      await rm(resolve(cacheDir, "ffmpeg.zip"), {
        recursive: true,
        force: true,
      });

      await rm(
        resolve(cacheDir, `nw.${platform === "linux" ? "tgz" : "zip"}`),
        { recursive: true, force: true },
      );
    });
  }
}
