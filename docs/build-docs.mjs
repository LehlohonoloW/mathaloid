#!/usr/bin/env node
/*
 MATHALOID Atlas docs pipeline — Lehro house pattern (Polaris MVP / LEHRO BMS).
 Zero-dependency Node generator: every canonical .md emits a themed .html + .json counterpart,
 plus portal (index.html), docs-map.json, index.json and release-manifest.json.
 Usage: node docs/build-docs.mjs        (build)
        node docs/build-docs.mjs --check (CI gate — fails on missing/stale/invalid counterparts)
*/
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const DOCS = dirname(fileURLToPath(import.meta.url));
const CHECK = process.argv.includes("--check");
const RELEASE = "v2.0.0";
const problems = [];
const sha = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);

/* ---------- collect canonical .md (docs/.docs is the engineering/evidence layer — no counterparts) ---------- */
const mdFiles = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { if (e === ".docs") continue; walk(p); }
    else if (e.endsWith(".md")) mdFiles.push(p);
  }
})(DOCS);

/* ---------- frontmatter + markdown ---------- */
function fm(src) {
  const meta = {}; let body = src;
  if (src.startsWith("---")) {
    const end = src.indexOf("\n---", 3);
    if (end > 0) {
      body = src.slice(end + 4);
      for (const line of src.slice(3, end).split("\n")) {
        const i = line.indexOf(":");
        if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
      }
    }
  }
  return { meta, body };
}
const list = (v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);
const slugify = (s) => s.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const escH = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function inline(s) {
  s = escH(s);
  s = s.replace(/`([^`]+)`/g, (m, c) => `<code>${c}</code>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  s = s.replace(/\*([^*]+)\*/g, "<i>$1</i>");
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return s;
}
function mdToHtml(md, headings = []) {
  const lines = md.split("\n");
  const out = [];
  let inCode = false, codeBuf = [], listType = null, tableBuf = [];
  const closeList = () => { if (listType) { out.push(listType === "ul" ? "</ul>" : "</ol>"); listType = null; } };
  const flushTable = () => {
    if (!tableBuf.length) return;
    const rows = tableBuf.map((r) => r.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim()));
    let html = '<div class="twrap"><table>';
    rows.forEach((cells, i) => {
      if (i === 1 && cells.every((c) => /^:?-+:?$/.test(c))) return;
      const tag = i === 0 ? "th" : "td";
      html += "<tr>" + cells.map((c) => `<${tag}>${inline(c)}</${tag}>`).join("") + "</tr>";
    });
    out.push(html + "</table></div>");
    tableBuf = [];
  };
  for (const line of lines) {
    if (inCode) {
      if (line.trim() === "```") { out.push(`<pre><code>${escH(codeBuf.join("\n"))}</code></pre>`); inCode = false; codeBuf = []; }
      else codeBuf.push(line);
      continue;
    }
    if (line.trim().startsWith("```")) { closeList(); flushTable(); inCode = true; continue; }
    if (/^\|/.test(line.trim())) { closeList(); tableBuf.push(line.trim()); continue; }
    flushTable();
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      closeList();
      const d = h[1].length, id = slugify(h[2]);
      if (d === 2) headings.push({ depth: d, text: h[2].replace(/[*`]/g, ""), id });
      out.push(`<h${d} id="${id}">${inline(h[2])} <a class="anchor" href="#${id}" aria-label="Link to this section">#</a></h${d}>`);
      continue;
    }
    if (/^---+\s*$/.test(line)) { closeList(); out.push("<hr>"); continue; }
    if (/^>\s?/.test(line)) { closeList(); out.push(`<blockquote>${inline(line.replace(/^>\s?/, ""))}</blockquote>`); continue; }
    const li = line.match(/^\s*[-*]\s+(.*)$/), oli = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (li || oli) {
      const want = li ? "ul" : "ol";
      if (listType !== want) { closeList(); out.push(want === "ul" ? "<ul>" : "<ol>"); listType = want; }
      out.push(`<li>${inline((li || oli)[1])}</li>`);
      continue;
    }
    if (!line.trim()) { closeList(); continue; }
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  if (inCode) out.push(`<pre><code>${escH(codeBuf.join("\n"))}</code></pre>`);
  closeList(); flushTable();
  return out.join("\n");
}

/* ---------- cosmic theme (mirrors css/atlas.css tokens — docs look like the product) ---------- */
const STYLE = `
:root{--bg:#05081a;--panel:rgba(16,24,58,.72);--line:rgba(122,144,255,.18);--text:#e8ecff;--muted:#91a5d6;--cyan:#4ee1ff;--purple:#a78bfa;--amber:#fbbf24;--pink:#f472b6;--green:#34d399;--font:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:radial-gradient(1200px 600px at 70% -10%,rgba(103,80,220,.25),transparent),radial-gradient(900px 500px at 10% 110%,rgba(30,120,190,.18),transparent),var(--bg);color:var(--text);font-family:var(--font);line-height:1.65}
header.site{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:14px;padding:14px clamp(16px,5vw,64px);background:rgba(5,8,26,.85);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.logo{font-weight:800;letter-spacing:.14em;font-size:14px}.logo b{color:var(--purple)}.logo span{color:var(--cyan)}
header.site nav{margin-left:auto;display:flex;gap:14px;font-size:13px}
a{color:var(--cyan);text-decoration:none}a:hover{text-decoration:underline}
a:focus-visible,button:focus-visible{outline:2px solid var(--cyan);outline-offset:2px;border-radius:4px}
main{max-width:960px;margin:0 auto;padding:28px clamp(16px,5vw,64px) 80px}
.hero{padding:34px 0 10px}.hero h1{font-size:clamp(26px,4vw,38px);margin:0 0 8px;background:linear-gradient(90deg,var(--cyan),var(--purple));-webkit-background-clip:text;background-clip:text;color:transparent}
.meta{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 4px}
.pill{border:1px solid var(--line);border-radius:999px;padding:3px 12px;font-size:12px;color:var(--muted);background:rgba(10,16,40,.5)}
.pill.status-current{color:var(--green);border-color:rgba(52,211,153,.4)}
article{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:clamp(18px,3vw,36px);margin-top:18px}
article h2{margin-top:2em;padding-bottom:6px;border-bottom:1px solid var(--line);color:#fff}
article h3{color:var(--purple)}
.anchor{opacity:0;font-weight:400;font-size:.8em;margin-left:2px}h2:hover .anchor,h3:hover .anchor,h1:hover .anchor{opacity:.8}
code{background:rgba(78,225,255,.1);border:1px solid rgba(78,225,255,.18);border-radius:6px;padding:1px 6px;font-size:.9em}
pre{background:#0a1028;border:1px solid var(--line);border-radius:12px;padding:16px;overflow:auto}pre code{background:none;border:none;padding:0}
blockquote{margin:14px 0;padding:10px 16px;border-left:3px solid var(--purple);background:rgba(167,139,250,.08);border-radius:0 10px 10px 0;color:var(--muted)}
.twrap{overflow-x:auto}table{border-collapse:collapse;width:100%;margin:14px 0}
th{background:linear-gradient(90deg,rgba(78,225,255,.15),rgba(167,139,250,.15));text-align:left}
th,td{border:1px solid var(--line);padding:8px 12px;font-size:14px}tr:hover td{background:rgba(78,225,255,.04)}
.toc{background:rgba(10,16,40,.5);border:1px solid var(--line);border-radius:12px;padding:14px 18px;margin-top:16px}
.toc b{font-size:12px;letter-spacing:.12em;color:var(--muted)}.toc ul{margin:8px 0 0;padding-left:18px}.toc li{margin:3px 0;font-size:14px}
footer.site{max-width:960px;margin:0 auto;padding:0 clamp(16px,5vw,64px) 48px;color:var(--muted);font-size:13px}
.related{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}
.related a{border:1px solid var(--line);border-radius:999px;padding:5px 14px;font-size:13px;background:rgba(10,16,40,.5)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin:18px 0 30px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px 18px;transition:transform .18s ease,border-color .18s ease}
.card:hover{transform:translateY(-3px);border-color:rgba(78,225,255,.45)}
.card h3{margin:0 0 6px;font-size:16px}.card p{margin:0 0 10px;font-size:13px;color:var(--muted)}
.sect{margin-top:34px;font-size:13px;letter-spacing:.14em;color:var(--muted);text-transform:uppercase}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}html{scroll-behavior:auto}}
@media (max-width:640px){header.site nav{display:none}}
`;

function pageHtml(doc) {
  const toc = doc.headings.length
    ? `<nav class="toc" aria-label="On this page"><b>ON THIS PAGE</b><ul>${doc.headings.map((h) => `<li><a href="#${h.id}">${escH(h.text)}</a></li>`).join("")}</ul></nav>`
    : "";
  const rel = doc.links.length
    ? `<h2 id="related-guides">Related guides</h2><div class="related">${doc.links.map((l) => `<a href="${doc.prefix}${l}.html">${escH(l)}</a>`).join("")}</div>`
    : "";
  return `<!DOCTYPE html>
<!-- generated by docs/build-docs.mjs — do not edit; edit ${doc.slug}.md -->
<!-- source-checksum: ${doc.checksum} -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escH(doc.title)} · MATHALOID Atlas Docs</title>
<style>${STYLE}</style>
</head>
<body>
<header class="site"><span class="logo"><b>MATHALOID</b> <span>ATLAS</span> DOCS</span><nav aria-label="Docs"><a href="${doc.prefix}index.html">Portal</a><a href="${doc.prefix}${doc.slug}.md">Markdown source</a><a href="${doc.prefix}${doc.slug}.json">JSON counterpart</a></nav></header>
<main>
<div class="hero">
<h1>${escH(doc.title)}</h1>
<div class="meta"><span class="pill status-${doc.status}">${escH(doc.status)}</span>${doc.audience.map((a) => `<span class="pill">${escH(a)}</span>`).join("")}<span class="pill">Last reviewed ${doc.lastReviewed}</span></div>
<p style="color:var(--muted)">${escH(doc.summary)}</p>
${doc.useWhen ? `<p style="color:var(--muted);font-size:13px"><b>Use when:</b> ${escH(doc.useWhen)}</p>` : ""}
</div>
${toc}
<article>
${doc.html}
${rel}
</article>
</main>
<footer class="site"><p>Counterparts: <a href="${doc.prefix}${doc.slug}.md">${doc.slug}.md</a> (canonical source) · <a href="${doc.prefix}${doc.slug}.json">${doc.slug}.json</a> (machine/RAG) · <a href="${doc.prefix}index.html">Docs portal</a></p><p>MATHALOID Atlas ${RELEASE} · MIT · Local-First · Privacy First · Powered by Lehro Solutions</p></footer>
</body>
</html>`;
}

/* ---------- build all docs ---------- */
const docs = [];
for (const file of mdFiles) {
  const relPath = relative(DOCS, file).replace(/\\/g, "/");
  const slug = relPath.replace(/\.md$/, "");
  if (slug === "README") continue; // README is the Markdown home; portal is its HTML face
  const src = readFileSync(file, "utf8");
  const { meta, body } = fm(src);
  const headings = [];
  const html = mdToHtml(body, headings);
  const depth = slug.split("/").length - 1;
  docs.push({
    slug,
    prefix: "../".repeat(depth),
    title: meta.title || slug,
    section: meta.section || (slug.startsWith("adrs/") ? "ADRs" : slug.startsWith("skills/") ? "Skills" : "Guides"),
    status: meta.status || "current",
    audience: list(meta.audience),
    useWhen: meta.useWhen || "",
    summary: meta.summary || "",
    keywords: list(meta.keywords),
    links: list(meta.links),
    lastReviewed: meta.lastReviewed || "",
    checksum: sha(src),
    headings, html,
    plaintext: body.replace(/```[\s\S]*?```/g, " ").replace(/[#>*`|\[\]()-]/g, " ").replace(/\s+/g, " ").trim(),
  });
}
const bySlug = Object.fromEntries(docs.map((d) => [d.slug, d]));

/* validate related links */
for (const d of docs) for (const l of d.links) {
  if (!bySlug[l] && !bySlug[`adrs/${l}`]) problems.push(`${d.slug}: related link "${l}" does not resolve to a canonical doc`);
}

function jsonFor(d) {
  const base = d.slug.split("/").pop();
  return {
    schemaVersion: "1.0",
    slug: d.slug,
    title: d.title,
    status: d.status,
    section: d.section,
    audience: d.audience,
    useWhen: d.useWhen,
    sourceOfTruth: `${base}.md`,
    counterparts: { markdown: `${base}.md`, html: `${base}.html`, json: `${base}.json` },
    summary: d.summary,
    sections: d.headings.map((h) => ({ id: h.id, label: h.text })),
    relatedGuides: d.links,
    keywords: d.keywords,
    lastReviewed: d.lastReviewed,
    release: RELEASE,
    sourceChecksum: d.checksum,
    generatedAt: new Date().toISOString(),
    plaintext: d.plaintext,
  };
}

const SECTIONS = ["Guides", "ADRs", "Skills"];
function portalHtml() {
  const groups = SECTIONS.filter((s) => docs.some((d) => d.section === s)).map((s) => {
    const cards = docs.filter((d) => d.section === s).sort((a, b) => a.slug.localeCompare(b.slug)).map((d) =>
      `<a class="card" href="${d.slug}.html"><h3>${escH(d.title)}</h3><p>${escH(d.summary)}</p><div class="meta"><span class="pill status-${d.status}">${escH(d.status)}</span>${d.audience.slice(0, 2).map((x) => `<span class="pill">${escH(x)}</span>`).join("")}</div></a>`
    ).join("");
    return `<h2 class="sect">${s}</h2><div class="grid">${cards}</div>`;
  }).join("");
  return `<!DOCTYPE html>
<!-- generated by docs/build-docs.mjs -->
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>MATHALOID Atlas — Documentation Portal</title><style>${STYLE}</style></head>
<body>
<header class="site"><span class="logo"><b>MATHALOID</b> <span>ATLAS</span> DOCS</span><nav aria-label="Docs"><a href="README.md">Markdown home</a><a href="docs-map.json">Docs map</a><a href="release-manifest.json">Release manifest</a><a href="../index.html">Open the app</a></nav></header>
<main>
<div class="hero"><h1>MATHALOID Atlas documentation</h1>
<p style="color:var(--muted)">Every tab. One atlas. Endless mathematics — and the docs to prove it. ${docs.length} canonical guides, each shipped as a Markdown source with generated HTML and JSON counterparts.</p>
<div class="meta"><span class="pill">Local-First</span><span class="pill">Privacy First</span><span class="pill">Open Source · MIT</span><span class="pill">Zero dependencies</span></div>
<div class="toc"><b>CHOOSE YOUR PATH</b><ul>
<li>Understand the product → <a href="overview.html">Overview</a></li>
<li>Run or deploy it → <a href="getting-started.html">Getting started</a></li>
<li>Change the code → <a href="architecture.html">Architecture</a> + <a href="contributing.html">Contributing</a></li>
<li>Understand the AI → <a href="ai.html">Mathaloid Brain</a></li>
<li>Validate a release → <a href="quality.html">Quality &amp; verification</a></li>
</ul></div>
</div>
${groups}
</main>
<footer class="site"><p>Engineering history lives in <code>docs/.docs/</code> (changelog · issue log). Rebuild with <code>node docs/build-docs.mjs</code>; gate with <code>--check</code>.</p><p>MATHALOID Atlas ${RELEASE} · MIT · Powered by Lehro Solutions</p></footer>
</body>
</html>`;
}

/* ---------- write or check ---------- */
const counts = { markdown: docs.length, html: 0, json: 0, adrs: docs.filter((d) => d.section === "ADRs").length, skills: docs.filter((d) => d.section === "Skills").length };
if (!CHECK) {
  for (const d of docs) {
    writeFileSync(join(DOCS, `${d.slug}.html`), pageHtml(d));
    writeFileSync(join(DOCS, `${d.slug}.json`), JSON.stringify(jsonFor(d), null, 2));
    counts.html++; counts.json++;
  }
  writeFileSync(join(DOCS, "index.html"), portalHtml());
  writeFileSync(join(DOCS, "docs-map.json"), JSON.stringify({ schemaVersion: "1.0", release: RELEASE, generatedAt: new Date().toISOString(), entries: docs.map((d) => ({ slug: d.slug, title: d.title, section: d.section, audience: d.audience, status: d.status, useWhen: d.useWhen, description: d.summary, lastReviewed: d.lastReviewed, counterparts: { markdown: `${d.slug}.md`, html: `${d.slug}.html`, json: `${d.slug}.json` } })) }, null, 2));
  writeFileSync(join(DOCS, "index.json"), JSON.stringify({ schemaVersion: "1.0", release: RELEASE, generatedAt: new Date().toISOString(), files: docs.map((d) => `${d.slug}.json`) }, null, 2));
  writeFileSync(join(DOCS, "release-manifest.json"), JSON.stringify({ release: RELEASE, sourceRevision: sha(mdFiles.map((f) => readFileSync(f, "utf8")).join("\n")), generatedAt: new Date().toISOString(), docsBuild: "node docs/build-docs.mjs — success", counts, checks: { counterpartsFresh: true, linksValid: problems.length === 0, jsonValid: true, portalIndexed: true } }, null, 2));
  console.log(`docs:build — ${docs.length} canonical guides → ${counts.html} HTML + ${counts.json} JSON + portal + docs-map + index + release-manifest`);
  if (problems.length) { console.error("WARNINGS:\n" + problems.join("\n")); process.exit(1); }
} else {
  for (const d of docs) {
    const h = join(DOCS, `${d.slug}.html`), j = join(DOCS, `${d.slug}.json`);
    if (!existsSync(h)) { problems.push(`missing HTML counterpart: ${d.slug}.html`); continue; }
    if (!existsSync(j)) { problems.push(`missing JSON counterpart: ${d.slug}.json`); continue; }
    const htmlSrc = readFileSync(h, "utf8");
    if (!htmlSrc.includes(`source-checksum: ${d.checksum}`)) problems.push(`stale HTML counterpart: ${d.slug}.html (run docs:build)`);
    for (const landmark of ["<header", "<nav", "<main", "<article", "<footer"]) if (!htmlSrc.includes(landmark)) problems.push(`${d.slug}.html missing semantic landmark ${landmark}>`);
    try {
      const parsed = JSON.parse(readFileSync(j, "utf8"));
      if (parsed.sourceChecksum !== d.checksum) problems.push(`stale JSON counterpart: ${d.slug}.json (run docs:build)`);
      if (parsed.sourceOfTruth !== `${d.slug.split("/").pop()}.md`) problems.push(`${d.slug}.json names wrong source of truth`);
      if (parsed.title !== d.title || parsed.status !== d.status) problems.push(`${d.slug}.json metadata drift (title/status)`);
    } catch (e) { problems.push(`invalid JSON: ${d.slug}.json — ${e.message}`); }
  }
  const portal = existsSync(join(DOCS, "index.html")) ? readFileSync(join(DOCS, "index.html"), "utf8") : "";
  if (!portal) problems.push("missing docs portal index.html");
  for (const d of docs) if (portal && !portal.includes(`${d.slug}.html`)) problems.push(`portal does not index ${d.slug}`);
  for (const f of ["docs-map.json", "index.json", "release-manifest.json"]) {
    if (!existsSync(join(DOCS, f))) { problems.push(`missing ${f}`); continue; }
    try { JSON.parse(readFileSync(join(DOCS, f), "utf8")); } catch (e) { problems.push(`invalid JSON: ${f}`); }
  }
  if (problems.length) { console.error(`docs:check FAILED — ${problems.length} problem(s):\n` + problems.map((p) => "  • " + p).join("\n")); process.exit(1); }
  console.log(`docs:check — OK. ${docs.length} canonical guides, all counterparts fresh, JSON valid, portal indexed.`);
}
