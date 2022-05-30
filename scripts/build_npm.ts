#!/usr/bin/env -S deno run --allow-read --allow-write=./,/Users/qwtel/Library/Caches/deno --allow-net --allow-env=HOME,DENO_AUTH_TOKENS,DENO_DIR --allow-run=git,pnpm

import { basename, extname } from "https://deno.land/std@0.133.0/path/mod.ts";
import { build, emptyDir } from "https://deno.land/x/dnt/mod.ts";

import { 
  copyMdFiles, mkPackage,
} from 'https://gist.githubusercontent.com/qwtel/ecf0c3ba7069a127b3d144afc06952f5/raw/latest-version.ts'

await emptyDir("./npm");

const name = basename(Deno.cwd())

await build({
  entryPoints: ["./index.ts"],
  outDir: "./npm",
  shims: {},
  test: false,
  package: await mkPackage(name),
  declaration: true,
  packageManager: 'pnpm',
  compilerOptions: {
    sourceMap: true,
    target: 'ES2019'
  },
  mappings: {
    "https://ghuc.cc/qwtel/cookie-store-interface/index.d.ts": {
      name: "cookie-store-interface",
      version: "^0.1.1",
    },
    "https://ghuc.cc/qwtel/typed-array-utils/index.ts": {
      name: "typed-array-utils",
      version: "^0.2.4",
    },
    "https://ghuc.cc/qwtel/base64-encoding/index.ts": {
      name: "base64-encoding",
      version: "latest",
    },
  },
});

// post build steps
await copyMdFiles()
