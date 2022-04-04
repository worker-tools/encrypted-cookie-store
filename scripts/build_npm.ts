#!/usr/bin/env -S deno run --allow-read --allow-write=./,/Users/qwtel/Library/Caches/deno --allow-net --allow-env=HOME,DENO_AUTH_TOKENS,DENO_DIR --allow-run=git,pnpm

// ex. scripts/build_npm.ts
import { basename, extname } from "https://deno.land/std@0.133.0/path/mod.ts";
import { build, emptyDir } from "https://deno.land/x/dnt/mod.ts";

import { 
  latestVersion, copyMdFiles, getDescription, getGHTopics, getGHLicense, getGHHomepage,
} from 'https://gist.githubusercontent.com/qwtel/ecf0c3ba7069a127b3d144afc06952f5/raw/latest-version.ts'

await emptyDir("./npm");

const name = basename(Deno.cwd())

await build({
  entryPoints: ["./index.ts"],
  outDir: "./npm",
  shims: {},
  test: false,
  package: {
    // package.json properties
    name: `@worker-tools/${name}`,
    version: await latestVersion(),
    description: await getDescription(),
    license: await getGHLicense(name) ?? 'MIT',
    publishConfig: {
      access: "public"
    },
    author: "Florian Klampfer <mail@qwtel.com> (https://qwtel.com/)",
    repository: {
      type: "git",
      url: `git+https://github.com/worker-tools/${name}.git`,
    },
    bugs: {
      url: `https://github.com/worker-tools/${name}/issues`,
    },
    homepage: await getGHHomepage(name) ?? `https://github.com/worker-tools/${name}#readme`,
    keywords: await getGHTopics(name) ?? [],
  },
  packageManager: 'pnpm',
  compilerOptions: {
    sourceMap: true,
    target: 'ES2021'
  },
  mappings: {
    // "https://esm.sh/(@?[^@]+)@([^/]+)/(.*).js": {
    //   name: "$1",
    //   version: "^$2",
    //   subPath: "$3.js",
    // },
    "https://esm.sh/cookie-store-interface@0.1.1/index.js": {
      name: "cookie-store-interface",
      version: "^0.1.1",
    },
    "https://esm.sh/uuid-class@0.12.3/index.js?module": {
      name: "uuid-class",
      version: "^0.12.3",
    },
    "https://esm.sh/typed-array-utils@0.2.2/index.js?module": {
      name: "typed-array-utils",
      version: "^0.2.2",
    },
    "https://esm.sh/base64-encoding@0.14.3/index.js?module": {
      name: "base64-encoding",
      version: "^0.14.3",
    },
  },
});

// post build steps
await copyMdFiles()
