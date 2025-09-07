import fs from "node:fs";

const [,, inFile="tokens.dtcg.json", outFile="tokens.generated.css"] = process.argv;
const data = JSON.parse(fs.readFileSync(inFile, "utf8"));

// ---------- helpers ----------
const lc = s => String(s).toLowerCase();
const isRef = v => typeof v === "string" && /^\{.+\}$/.test(v);
const sanitize = parts =>
  (Array.isArray(parts)? parts : [parts])
  .map(p => lc(p).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''))
  .filter(Boolean).join('-');

const get = (obj, path) => path.reduce((o,k)=> (o && o[k]!=null)? o[k] : undefined, obj);
const tops = Object.keys(data);

// index EVERY token by full dot path (with spaces preserved)
function indexTokens(obj, path=[], map=new Map()) {
  for (const [k,v] of Object.entries(obj ?? {})) {
    if (v && typeof v === "object") {
      if ("value" in v || "$value" in v) map.set([...path, k].join("."), v);
      indexTokens(v, [...path, k], map);
    }
  }
  return map;
}
const INDEX = indexTokens(data);

// build a suffix index so "{White.1000}" can match "...color-primitives-value.White.1000"
const SUFFIX_INDEX = new Map();
for (const fullKey of INDEX.keys()) {
  const segs = fullKey.split(".");
  // record last 2 and last 3 segments as suffixes
  for (const n of [1,2,3]) {
    if (segs.length >= n) {
      const suffix = segs.slice(-n).join(".");
      if (!SUFFIX_INDEX.has(suffix)) SUFFIX_INDEX.set(suffix, []);
      SUFFIX_INDEX.get(suffix).push(fullKey);
    }
  }
}

function rawValue(node) { return node?.value ?? node?.$value; }

// prefer primitives if multiple matches; then shorter keys
function pickBest(keys) {
  if (!keys || !keys.length) return null;
  const scored = keys.map(k => {
    const s = lc(k);
    const primitiveBoost =
      (s.includes("primitive") || s.includes("primitives")) ? 0 : 1;
    return {k, score: primitiveBoost, len: k.split(".").length};
  });
  scored.sort((a,b) => a.score - b.score || a.len - b.len || a.k.localeCompare(b.k));
  return scored[0].k;
}

function resolveRef(ref, seen=new Set()) {
  const key = ref.slice(1,-1); // keep exact text, including spaces
  if (seen.has(key)) throw new Error(`Circular reference: ${[...seen, key].join(" -> ")}`);
  seen.add(key);

  // 1) exact full match
  if (INDEX.has(key)) {
    const node = INDEX.get(key);
    const val = rawValue(node);
    return (typeof val === "string" && isRef(val)) ? resolveRef(val, seen) : val;
  }
  // 2) suffix match "...X.Y" ends with "White.1000" or "Body.Font Weight Regular"
  const cand = pickBest(SUFFIX_INDEX.get(key));
  if (cand) {
    const node = INDEX.get(cand);
    const val = rawValue(node);
    return (typeof val === "string" && isRef(val)) ? resolveRef(val, seen) : val;
  }
  throw new Error(`Missing token "${key}"`);
}

function resolveValue(node) {
  const v = rawValue(node);
  if (v == null) throw new Error("Token node has no value");
  if (typeof v === "string") return isRef(v) ? resolveRef(v) : v;
  return v; // composite object (e.g., typography block)
}

const emitBlock = (selector, kv) => {
  const lines = [ `${selector} {` ];
  for (const [k, v] of kv) lines.push(`  ${k}: ${v};`);
  lines.push(`}`);
  return lines.join("\n");
};

const ensurePx = x =>
  typeof x === "number" ? `${x}px`
  : (typeof x === "string" && /^\d+(\.\d+)?$/.test(x) ? `${x}px` : String(x));

// ---------- color aliases from your sets ----------
const colorMap = {
  light: {
    "--ds-bg": ["color-sds light","Background","Default","Default"],
    "--ds-bg-hover": ["color-sds light","Background","Default","Default Hover"],
    "--ds-surface-2": ["color-sds light","Background","Default","Secondary"],
    "--ds-surface-3": ["color-sds light","Background","Default","Tertiary"],
    "--ds-text": ["color-sds light","Text","Default","Default"],
    "--ds-text-muted": ["color-sds light","Text","Default","Secondary"],
    "--ds-border": ["color-sds light","Border","Default","Default"],
    "--ds-accent": ["color-sds light","Background","Brand","Default"],
    "--ds-accent-hover": ["color-sds light","Background","Brand","Hover"],
    "--ds-on-accent": ["color-sds light","Text","Brand","On Brand"],
    "--ds-focus": ["color-sds light","Border","Brand","Default"],
    "--ds-overlay": ["color-sds light","Background","Utilities","Overlay"],
  },
  dark: {
    "--ds-bg": ["color-sds dark","Background","Default","Default"],
    "--ds-bg-hover": ["color-sds dark","Background","Default","Default Hover"],
    "--ds-surface-2": ["color-sds dark","Background","Default","Secondary"],
    "--ds-surface-3": ["color-sds dark","Background","Default","Tertiary"],
    "--ds-text": ["color-sds dark","Text","Default","Default"],
    "--ds-text-muted": ["color-sds dark","Text","Default","Secondary"],
    "--ds-border": ["color-sds dark","Border","Default","Default"],
    "--ds-accent": ["color-sds dark","Background","Brand","Default"],
    "--ds-accent-hover": ["color-sds dark","Background","Brand","Hover"],
    "--ds-on-accent": ["color-sds dark","Text","Brand","On Brand"],
    "--ds-focus": ["color-sds dark","Border","Brand","Default"],
    "--ds-overlay": ["color-sds dark","Background","Utilities","Overlay"],
  },
  brandBLight: {
    "--ds-bg": ["color-brand b light","Background","Default","Default"],
    "--ds-bg-hover": ["color-brand b light","Background","Default","Default Hover"],
    "--ds-surface-2": ["color-brand b light","Background","Default","Secondary"],
    "--ds-surface-3": ["color-brand b light","Background","Default","Tertiary"],
    "--ds-text": ["color-brand b light","Text","Default","Default"],
    "--ds-text-muted": ["color-brand b light","Text","Default","Secondary"],
    "--ds-border": ["color-brand b light","Border","Default","Default"],
    "--ds-accent": ["color-brand b light","Background","Brand","Default"],
    "--ds-accent-hover": ["color-brand b light","Background","Brand","Hover"],
    "--ds-on-accent": ["color-brand b light","Text","Brand","On Brand"],
    "--ds-focus": ["color-brand b light","Border","Brand","Default"],
    "--ds-overlay": ["color-brand b light","Background","Utilities","Overlay"],
  }
};

function pick(path) {
  const node = get(data, path);
  if (!node) throw new Error(`Missing token: ${path.join(" > ")}`);
  return resolveValue(node);
}

// ---------- build CSS ----------
let css = `/* Auto-generated from ${inFile}. Do not edit by hand. */\n`;

css += emitBlock(":root",
  Object.entries(colorMap.light).map(([k,p]) => [k, pick(p)])
) + "\n\n";

css += emitBlock('[data-theme="dark"]',
  Object.entries(colorMap.dark).map(([k,p]) => [k, pick(p)])
) + "\n\n";

css += '/* Brand B (light) override */\n';
css += emitBlock('[data-brand="b"]',
  Object.entries(colorMap.brandBLight).map(([k,p]) => [k, pick(p)])
) + "\n\n";

// walk nested objects and collect token nodes
function walk(obj, path=[], out=[]) {
  for (const [k,v] of Object.entries(obj ?? {})) {
    if (v && typeof v === "object" && ("value" in v || "$value" in v)) {
      out.push({ path: [...path, k], node: v });
    } else if (v && typeof v === "object") {
      walk(v, [...path, k], out);
    }
  }
  return out;
}

// SIZE
for (const key of tops.filter(k => /^size/i.test(k))) {
  const tokens = walk(data[key]);
  const kv = [];
  for (const {path,node} of tokens) {
    const val = resolveValue(node);
    kv.push([`--ds-size-${sanitize(path)}`, ensurePx(val)]);
  }
  if (kv.length) css += `/* ${key} */\n` + emitBlock(":root", kv) + "\n\n";
}

// RESPONSIVE (breakpoints etc.)
for (const key of tops.filter(k => /^responsive/i.test(k))) {
  const tokens = walk(data[key]);
  const kv = [];
  for (const {path,node} of tokens) {
    const val = resolveValue(node);
    const name = `--ds-bp-${sanitize([key.replace(/^responsive[-_]?/, ''), ...path])}`;
    kv.push([name, ensurePx(val)]);
  }
  if (kv.length) css += `/* ${key} */\n` + emitBlock(":root", kv) + "\n\n";
}

// TYPOGRAPHY (composite-safe)
function emitTypography(rootKey, selector=':root') {
  const tokens = walk(data[rootKey]);
  const kv = [];
  for (const {path,node} of tokens) {
    const val = resolveValue(node);
    if (val && typeof val === "object") {
      const base = `--ds-type-${sanitize(path)}`;
      for (const [prop,raw] of Object.entries(val)) {
        let v = raw;
        if (["fontSize","lineHeight","paragraphSpacing","paragraphIndent","letterSpacing"].includes(prop)) {
          v = ensurePx(raw);
        }
        kv.push([`${base}-${sanitize(prop)}`, v]);
      }
    } else {
      kv.push([`--ds-type-${sanitize(path)}`, String(val)]); // weights etc.
    }
  }
  if (kv.length) css += `/* ${rootKey} */\n` + emitBlock(selector, kv) + "\n\n";
}

// default typography sets
for (const key of tops.filter(k => /^typography/i.test(k) && /default/i.test(k))) {
  emitTypography(key, ':root');
}
// mode sets (export under data attribute switch)
for (const key of tops.filter(k => /^typography/i.test(k) && /mode/i.test(k))) {
  const mode = sanitize(key.replace(/^typography[-_]?/,''));
  emitTypography(key, `[data-typography="${mode}"]`);
}

fs.writeFileSync(outFile, css, "utf8");
console.log(`Wrote ${outFile}`);
