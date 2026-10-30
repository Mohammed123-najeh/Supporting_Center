// Keep `.next` OFF OneDrive during local dev on Windows.
//
// WHY: this repo lives under a OneDrive-synced path. OneDrive continuously
// grabs/locks files while Next.js's dev server writes `.next` (atomic
// `foo.pack.gz_` -> `foo.pack.gz` renames, the routes-manifest, per-route
// server chunks). The lock makes those writes fail with ENOENT, which corrupts
// the dev server's route state — every request then 404s (or 500s) and the app
// "renders forever / never opens". A green `tsc` hides it because it's a runtime
// filesystem race, not a type error.
//
// FIX: make `app/.next` a Windows *directory junction* to a folder under
// %LOCALAPPDATA% (which OneDrive never syncs). Next writes to `.next` exactly as
// before — the bytes just physically live where OneDrive can't touch them.
//
// The junction target also needs a sibling `node_modules` (junctioned to the
// real one) because Next's compiled server chunks `require('next/dist/...')` by
// walking UP the directory tree from the chunk's *physical* location; without a
// reachable node_modules the runtime require fails ("Cannot find module
// next/dist/compiled/next-server/app-page.runtime.dev.js").
//
// This runs as `predev` so `npm run dev` always self-heals the junction (e.g.
// after someone `rm -rf .next`, or on a fresh clone). It is a NO-OP on
// non-Windows (CI / Linux VPS / Docker build), where `.next` is a normal folder
// and `next build` must write it in-place.
import { execSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const appDir = path.resolve(import.meta.dirname, "..")
const dotNext = path.join(appDir, ".next")

// Only intervene on Windows AND only when the project actually sits under a
// OneDrive path — otherwise leave `.next` completely alone.
const isWindows = process.platform === "win32"
// (Also matches business OneDrive roots such as "OneDrive - aesg.com".)
const underOneDrive = /[\\/]OneDrive(?: - [^\\/]+)?[\\/]/i.test(appDir)

function log(msg) {
  console.log(`[ensure-next-dir] ${msg}`)
}

function isJunction(p) {
  try {
    return fs.lstatSync(p).isSymbolicLink() // junctions report as symlinks to lstat
  } catch {
    return false
  }
}

if (!isWindows || !underOneDrive) {
  // Nothing to do — normal `.next` folder is correct here.
  process.exit(0)
}

const base = path.join(process.env.LOCALAPPDATA || os.tmpdir(), "next-build-cache", "supporting-center-landing")
const targetNext = path.join(base, ".next")
const targetNodeModules = path.join(base, "node_modules")
const realNodeModules = path.join(appDir, "node_modules")

try {
  // If `.next` is already a junction, assume it's good and bail fast (idempotent).
  if (isJunction(dotNext)) {
    process.exit(0)
  }

  // If `.next` exists as a REAL folder (e.g. created by a previous in-place build
  // or a `next dev` that ran before this guard existed), remove it so we can
  // replace it with the junction. Its contents are just a rebuildable cache.
  if (fs.existsSync(dotNext)) {
    log("removing in-place .next (will be rebuilt off OneDrive)")
    fs.rmSync(dotNext, { recursive: true, force: true })
  }

  // Ensure the off-OneDrive target dirs exist.
  fs.mkdirSync(targetNext, { recursive: true })

  // Sibling node_modules junction so Next's runtime require resolves from the
  // relocated chunks. Recreate if missing/broken.
  if (!isJunction(targetNodeModules)) {
    if (fs.existsSync(targetNodeModules)) fs.rmSync(targetNodeModules, { recursive: true, force: true })
    execSync(`mklink /J "${targetNodeModules}" "${realNodeModules}"`, { shell: "cmd.exe", stdio: "ignore" })
  }

  // Finally, junction app/.next -> target .next.
  execSync(`mklink /J "${dotNext}" "${targetNext}"`, { shell: "cmd.exe", stdio: "ignore" })
  log(`.next -> ${targetNext} (off OneDrive)`)
} catch (err) {
  // Never block `next dev` on this — if junctioning fails, fall back to a normal
  // .next (the OneDrive race may or may not bite, but the dev server still runs).
  log(`WARN could not junction .next off OneDrive: ${err?.message ?? err}`)
  try {
    if (!fs.existsSync(dotNext)) fs.mkdirSync(dotNext, { recursive: true })
  } catch {
    /* ignore */
  }
  process.exit(0)
}
