// Rendu de la video de presentation, image par image.
//
//   node video-source/rendre.mjs            les deux formats
//   node video-source/rendre.mjs site       1920 x 1080, pour le site
//   node video-source/rendre.mjs facebook   1080 x 1350, pour le fil Facebook
//   APERCU=3,13,21 node video-source/rendre.mjs site
//                                           quelques images PNG, sans video
//
// Lance Chrome sans fenetre, appelle render(t) dans scenes.html pour chaque
// image, la capture, et la passe a ffmpeg. Aucune dependance : Node 22+
// (WebSocket natif), Google Chrome et ffmpeg suffisent.

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const SORTIE = resolve(ICI, "../assets/video");
const CHROME = process.env.CHROME ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const IPS = 25;

const FORMATS = {
  site: { w: 1920, h: 1080, fichier: "agrotech-faso-presentation.mp4", crf: 24 },
  facebook: { w: 1080, h: 1350, fichier: "agrotech-faso-presentation-facebook.mp4", crf: 20 },
};

function attendre(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function lancerChrome() {
  const profil = mkdtempSync(join(tmpdir(), "agrotech-video-"));
  const chrome = spawn(CHROME, [
    "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profil}`,
    "--allow-file-access-from-files", "--hide-scrollbars", "--force-color-profile=srgb",
    "--disable-gpu", "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });

  const adresse = await new Promise((ok, ko) => {
    let tampon = "";
    chrome.stderr.on("data", (d) => {
      tampon += d;
      const m = tampon.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) ok(m[1]);
    });
    chrome.on("exit", () => ko(new Error("Chrome s'est arrete au lancement")));
  });

  const port = new URL(adresse).port;
  const cibles = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const page = cibles.find((c) => c.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((ok) => ws.addEventListener("open", ok, { once: true }));

  let id = 0;
  const attente = new Map();
  ws.addEventListener("message", (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && attente.has(msg.id)) {
      const { ok, ko } = attente.get(msg.id);
      attente.delete(msg.id);
      msg.error ? ko(new Error(msg.error.message)) : ok(msg.result);
    }
  });
  const envoyer = (method, params = {}) => new Promise((ok, ko) => {
    id += 1;
    attente.set(id, { ok, ko });
    ws.send(JSON.stringify({ id, method, params }));
  });

  const fermer = async () => {
    ws.close();
    const fini = new Promise((r) => chrome.once("exit", r));
    chrome.kill();
    await fini;
    rmSync(profil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  };
  return { envoyer, fermer };
}

async function evaluer(envoyer, expression) {
  const r = await envoyer("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
}

async function ouvrir(f) {
  const chrome = await lancerChrome();
  const { envoyer } = chrome;
  await envoyer("Emulation.setDeviceMetricsOverride", { width: f.w, height: f.h, deviceScaleFactor: 1, mobile: false });
  const url = pathToFileURL(join(ICI, "scenes.html")).href + `?w=${f.w}&h=${f.h}`;
  await envoyer("Page.navigate", { url });
  await attendre(500);
  await evaluer(envoyer, `new Promise(r => { const ok = () => document.fonts.ready.then(() =>
    Promise.all([...document.images].map(i => i.decode().catch(() => {})))).then(r);
    document.readyState === "complete" ? ok() : addEventListener("load", ok); })`);
  return chrome;
}

async function apercu(nom, instants) {
  const f = FORMATS[nom];
  const { envoyer, fermer } = await ouvrir(f);
  try {
    for (const t of instants) {
      await evaluer(envoyer, `render(${t})`);
      const { data } = await envoyer("Page.captureScreenshot", { format: "png" });
      const fichier = join(tmpdir(), `apercu-${nom}-${t}.png`);
      writeFileSync(fichier, Buffer.from(data, "base64"));
      process.stdout.write(`${fichier}\n`);
    }
  } finally {
    await fermer();
  }
}

async function rendre(nom) {
  const f = FORMATS[nom];
  const { envoyer, fermer } = await ouvrir(f);
  try {
    const duree = await evaluer(envoyer, "DUREE");
    const total = Math.round(duree * IPS);

    const fichier = join(SORTIE, f.fichier);
    const ffmpeg = spawn("ffmpeg", [
      "-y", "-loglevel", "error",
      "-f", "image2pipe", "-framerate", String(IPS), "-c:v", "png", "-i", "-",
      "-i", join(ICI, "nappe.m4a"),
      "-map", "0:v", "-map", "1:a", "-shortest",
      "-c:v", "libx264", "-preset", "slow", "-crf", String(f.crf), "-pix_fmt", "yuv420p",
      "-profile:v", "high", "-movflags", "+faststart",
      "-c:a", "aac", "-b:a", "128k",
      fichier,
    ], { stdio: ["pipe", "inherit", "inherit"] });

    for (let i = 0; i < total; i += 1) {
      await evaluer(envoyer, `render(${(i / IPS).toFixed(4)})`);
      const { data } = await envoyer("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      if (!ffmpeg.stdin.write(Buffer.from(data, "base64"))) {
        await new Promise((r) => ffmpeg.stdin.once("drain", r));
      }
      if (i % 250 === 0) process.stdout.write(`${nom} : ${i}/${total}\n`);
    }
    ffmpeg.stdin.end();
    await new Promise((ok, ko) => ffmpeg.on("exit", (c) => (c === 0 ? ok() : ko(new Error(`ffmpeg ${c}`)))));
    process.stdout.write(`${nom} : ${fichier}\n`);
  } finally {
    await fermer();
  }
}

const demandes = process.argv.slice(2);
for (const nom of demandes.length ? demandes : Object.keys(FORMATS)) {
  if (!FORMATS[nom]) throw new Error(`Format inconnu : ${nom}`);
  if (process.env.APERCU) {
    await apercu(nom, process.env.APERCU.split(",").map(Number));
  } else {
    await rendre(nom);
  }
}
