import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

const sourceUrl =
  "https://mzmfncofzwomtbbnkipt.supabase.co/storage/v1/object/public/images/cms/state.json";
const outputDirectory = new URL("../public/cms/body/", import.meta.url);
const manifestUrl = new URL("manifest.json", outputDirectory);

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchWithRetry(url, options = {}, attempts = 8) {
  let response;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(45_000),
    });
    if (![429, 500, 502, 503, 504].includes(response.status)) return response;
    await response.arrayBuffer();
    await sleep(attempt * 5_000);
  }
  return response;
}

const sourceResponse = await fetchWithRetry(sourceUrl);
if (!sourceResponse.ok) throw new Error(`CMS backup returned ${sourceResponse.status}`);
const document = await sourceResponse.json();
const images = [];

for (const post of document.posts ?? []) {
  let index = 0;
  for (const match of post.content.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)) {
    index += 1;
    const originalUrl = match[1];
    const token = /\/s\/([^/]+)/.exec(originalUrl)?.[1];
    if (token) images.push({ slug: post.slug, index, originalUrl, token });
  }
}

await mkdir(outputDirectory, { recursive: true });
const manifest = [];

for (const [position, image] of images.entries()) {
  const share = await fetchWithRetry(`https://nc.orikumi.com/s/${image.token}`);
  if (share.status === 404) {
    manifest.push({ ...image, status: "missing" });
    console.log(`${position + 1}/${images.length}: missing ${image.slug} #${image.index}`);
    continue;
  }
  if (!share.ok) throw new Error(`Share ${image.token} returned ${share.status}`);

  const authorization = Buffer.from(`${image.token}:`).toString("base64");
  const download = await fetchWithRetry(
    `https://nc.orikumi.com/public.php/dav/files/${image.token}/`,
    { headers: { Authorization: `Basic ${authorization}` } },
  );
  const contentType = (download.headers.get("content-type") ?? "").split(";")[0];
  if (!download.ok || !contentType.startsWith("image/")) {
    throw new Error(`Image ${image.token} returned ${download.status} ${contentType}`);
  }

  const bytes = Buffer.from(await download.arrayBuffer());
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const safeSlug = image.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const filename = `${safeSlug}-${image.index}-${hash}.${extension}`;
  await writeFile(new URL(filename, outputDirectory), bytes);
  manifest.push({
    ...image,
    status: "recovered",
    localUrl: `/cms/body/${filename}`,
    bytes: bytes.length,
    contentType,
  });
  console.log(`${position + 1}/${images.length}: recovered ${image.slug} #${image.index}`);
  await sleep(500);
}

await writeFile(manifestUrl, `${JSON.stringify(manifest, null, 2)}\n`);
const recovered = manifest.filter((image) => image.status === "recovered").length;
const missing = manifest.length - recovered;
console.log(`Recovered ${recovered}; missing ${missing}`);
