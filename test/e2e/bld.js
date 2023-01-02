import { platform } from "node:process";
import nwbuild from "nw-builder";

if (platform === "linux") {
  await nwbuild({
    srcDir: "./nwapp",
    mode: "build",
    version: "0.70.1",
    flavour: "normal",
    platform: "linux",
    arch: "x64",
    outDir: "./build/nix",
  });
}

if (platform === "darwin") {
  await nwbuild({
    srcDir: "./nwapp",
    mode: "build",
    version: "0.70.1",
    flavour: "normal",
    platform: "osx",
    arch: "x64",
    outDir: "./build/osx",
  });
}

if (platform === "win32") {
  await nwbuild({
    srcDir: "./nwapp",
    mode: "build",
    version: "0.70.1",
    flavour: "normal",
    platform: "win",
    arch: "x64",
    outDir: "./build/win",
  });
}