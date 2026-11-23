/** Content identity of this loaded source/build tree and its resolved Pi SDK. */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let buildId: string | undefined;

/** Capture once. Immutable release directories are required for installed qualification. */
export function getForkBuildId(): string {
  if (buildId) return buildId;
  const root = dirname(fileURLToPath(import.meta.url));
  const hash = createHash("sha256");
  const visit = (dir: string, prefix: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      const name = `${prefix}${entry.name}`;
      if (entry.isDirectory()) visit(join(dir, entry.name), `${name}/`);
      else if (/\.(ts|js)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
        hash.update(name).update("\0").update(readFileSync(join(dir, entry.name))).update("\0");
      }
    }
  };
  visit(root, "");
  hash.update(readFileSync(join(root, "..", "package.json")));
  const sdkEntry = fileURLToPath(import.meta.resolve("@earendil-works/pi-coding-agent"));
  hash.update(readFileSync(join(dirname(sdkEntry), "..", "package.json")));
  buildId = `sha256:${hash.digest("hex")}`;
  return buildId;
}
