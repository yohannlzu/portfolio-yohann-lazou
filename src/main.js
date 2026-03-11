import "../style.css";

const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => Array.from(el.querySelectorAll(q));

/* Year */
(() => {
  const y = $("#year");
  if (y) y.textContent = String(new Date().getFullYear());
})();

/* Clock */
(() => {
  const el = $("#clock");
  if (!el) return;
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () => {
    const d = new Date();
    el.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };
  tick();
  setInterval(tick, 1000);
})();

/* Scroll lock */
let locks = 0;
const lockScroll = () => {
  locks++;
  document.body.classList.add("no-scroll");
};
const unlockScroll = () => {
  locks = Math.max(0, locks - 1);
  if (!locks) document.body.classList.remove("no-scroll");
};

/* Drawer */
(() => {
  const drawer = $("#drawer");
  const btn = $("#menuBtn");
  const close = $("#drawerClose");
  const back = $("#drawerBackdrop");

  if (!drawer || !btn) return;

  const open = () => {
    drawer.classList.add("is-on");
    drawer.setAttribute("aria-hidden", "false");
    btn.setAttribute("aria-expanded", "true");
    lockScroll();
  };

  const shut = () => {
    drawer.classList.remove("is-on");
    drawer.setAttribute("aria-hidden", "true");
    btn.setAttribute("aria-expanded", "false");
    unlockScroll();
  };

  btn.addEventListener("click", open);
  close?.addEventListener("click", shut);
  back?.addEventListener("click", shut);

  drawer.addEventListener("click", (e) => {
    if (e.target.matches("[data-jump]")) shut();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") shut();
  });
})();

/* Desktop index active + progress bar */
(() => {
  const bar = $("#progressBar");
  const items = $$(".index .idx[data-chapter]");
  const sections = $$("section.plate[data-chapter]");

  if (!sections.length || !items.length) return;

  const setActive = (chapter) => {
    items.forEach((a) => a.classList.toggle("is-on", a.dataset.chapter === chapter));
  };

  const update = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const p = max > 0 ? doc.scrollTop / max : 0;

    if (bar) bar.style.height = `${Math.max(0, Math.min(1, p)) * 100}%`;

    const y = window.scrollY + window.innerHeight * 0.35;
    let current = sections[0];
    for (const s of sections) if (s.offsetTop <= y) current = s;

    const chapter = current?.dataset.chapter;
    if (chapter) setActive(chapter);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
})();

/* Interests preview: image behind hovered card */
(() => {
  const section = $("#interests");
  if (!section) return;

  const cards = Array.from(section.querySelectorAll(".interest-card[data-preview]"));
  if (!cards.length) return;

  cards.forEach((card) => {
    if (card.querySelector(".interest-bg")) return;
    const bg = document.createElement("div");
    bg.className = "interest-bg";
    card.prepend(bg);
  });

  let active = null;

  function activate(card) {
    if (!card || active === card) return;
    active?.classList.remove("is-active");
    active = card;

    const url = card.getAttribute("data-img");
    const pos = card.getAttribute("data-pos") || "50% 50%";
    const bg = card.querySelector(".interest-bg");
    if (bg && url) {
      bg.style.backgroundImage = `url("${url}")`;
      bg.style.backgroundPosition = pos;
    }
    card.classList.add("is-active");
  }

  function clear() {
    active?.classList.remove("is-active");
    active = null;
  }

  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => activate(card));
    card.addEventListener("mousemove", () => activate(card));
  });

  section.addEventListener("mouseleave", clear);
})();

/* Tabs (alternance/stage) */
(() => {
  const btns = $$(".tab[data-tab]");
  const panels = $$(".panel[data-panel]");
  if (!btns.length || !panels.length) return;

  const set = (key) => {
    btns.forEach((b) => {
      const on = b.dataset.tab === key;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });

    panels.forEach((p) => p.classList.toggle("is-on", p.dataset.panel === key));
  };

  set(btns.find((b) => b.classList.contains("is-on"))?.dataset.tab || btns[0].dataset.tab);
  btns.forEach((b) => b.addEventListener("click", () => set(b.dataset.tab)));
})();

/* Dithered Waves background (WebGL) */
(() => {
  const canvas = document.getElementById("hud");
  if (!canvas) return;

  const CONFIG = {
    waveSpeed: 0.05,
    waveFrequency: 3.0,
    waveAmplitude: 0.3,
    waveColor: [0.5, 0.5, 0.5],
    colorNum: 4.0,
    pixelSize: 2.0,
    disableAnimation: false,
    enableMouseInteraction: true,
    mouseRadius: 1.0,
  };

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) return;

  const vs = `
    attribute vec2 position;
    varying vec2 vUv;
    void main(){
      vUv = position * 0.5 + 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fs = `
    precision highp float;
    varying vec2 vUv;
    uniform vec2 resolution;
    uniform float time;
    uniform float waveSpeed;
    uniform float waveFrequency;
    uniform float waveAmplitude;
    uniform vec3 waveColor;
    uniform vec2 mousePos;
    uniform int enableMouseInteraction;
    uniform float mouseRadius;
    uniform float colorNum;
    uniform float pixelSize;

    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    vec2 fade(vec2 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

    float cnoise(vec2 P) {
      vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
      vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
      Pi = mod289(Pi);
      vec4 ix = Pi.xzxz;
      vec4 iy = Pi.yyww;
      vec4 fx = Pf.xzxz;
      vec4 fy = Pf.yyww;
      vec4 i = permute(permute(ix) + iy);
      vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0;
      vec4 gy = abs(gx) - 0.5;
      vec4 tx = floor(gx + 0.5);
      gx = gx - tx;
      vec2 g00 = vec2(gx.x, gy.x);
      vec2 g10 = vec2(gx.y, gy.y);
      vec2 g01 = vec2(gx.z, gy.z);
      vec2 g11 = vec2(gx.w, gy.w);
      vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
      g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
      float n00 = dot(g00, vec2(fx.x, fy.x));
      float n10 = dot(g10, vec2(fx.y, fy.y));
      float n01 = dot(g01, vec2(fx.z, fy.z));
      float n11 = dot(g11, vec2(fx.w, fy.w));
      vec2 fade_xy = fade(Pf.xy);
      vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
      return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
    }

    const int OCTAVES = 4;
    float fbm(vec2 p) {
      float value = 0.0;
      float amp = 1.0;
      float freq = waveFrequency;
      for (int i = 0; i < OCTAVES; i++) {
        value += amp * abs(cnoise(p));
        p *= freq;
        amp *= waveAmplitude;
      }
      return value;
    }

    float pattern(vec2 p) {
      vec2 p2 = p - time * waveSpeed;
      return fbm(p + fbm(p2));
    }

    float bayer8(vec2 p){
      float x = mod(p.x, 8.0);
      float y = mod(p.y, 8.0);
      float v = 0.0;
      if (y < 1.0){
        if (x < 1.0) v = 0.0; else if (x < 2.0) v = 48.0; else if (x < 3.0) v = 12.0; else if (x < 4.0) v = 60.0;
        else if (x < 5.0) v = 3.0; else if (x < 6.0) v = 51.0; else if (x < 7.0) v = 15.0; else v = 63.0;
      } else if (y < 2.0){
        if (x < 1.0) v = 32.0; else if (x < 2.0) v = 16.0; else if (x < 3.0) v = 44.0; else if (x < 4.0) v = 28.0;
        else if (x < 5.0) v = 35.0; else if (x < 6.0) v = 19.0; else if (x < 7.0) v = 47.0; else v = 31.0;
      } else if (y < 3.0){
        if (x < 1.0) v = 8.0; else if (x < 2.0) v = 56.0; else if (x < 3.0) v = 4.0; else if (x < 4.0) v = 52.0;
        else if (x < 5.0) v = 11.0; else if (x < 6.0) v = 59.0; else if (x < 7.0) v = 7.0; else v = 55.0;
      } else if (y < 4.0){
        if (x < 1.0) v = 40.0; else if (x < 2.0) v = 24.0; else if (x < 3.0) v = 36.0; else if (x < 4.0) v = 20.0;
        else if (x < 5.0) v = 43.0; else if (x < 6.0) v = 27.0; else if (x < 7.0) v = 39.0; else v = 23.0;
      } else if (y < 5.0){
        if (x < 1.0) v = 2.0; else if (x < 2.0) v = 50.0; else if (x < 3.0) v = 14.0; else if (x < 4.0) v = 62.0;
        else if (x < 5.0) v = 1.0; else if (x < 6.0) v = 49.0; else if (x < 7.0) v = 13.0; else v = 61.0;
      } else if (y < 6.0){
        if (x < 1.0) v = 34.0; else if (x < 2.0) v = 18.0; else if (x < 3.0) v = 46.0; else if (x < 4.0) v = 30.0;
        else if (x < 5.0) v = 33.0; else if (x < 6.0) v = 17.0; else if (x < 7.0) v = 45.0; else v = 29.0;
      } else if (y < 7.0){
        if (x < 1.0) v = 10.0; else if (x < 2.0) v = 58.0; else if (x < 3.0) v = 6.0; else if (x < 4.0) v = 54.0;
        else if (x < 5.0) v = 9.0; else if (x < 6.0) v = 57.0; else if (x < 7.0) v = 5.0; else v = 53.0;
      } else {
        if (x < 1.0) v = 42.0; else if (x < 2.0) v = 26.0; else if (x < 3.0) v = 38.0; else if (x < 4.0) v = 22.0;
        else if (x < 5.0) v = 41.0; else if (x < 6.0) v = 25.0; else if (x < 7.0) v = 37.0; else v = 21.0;
      }
      return (v / 64.0);
    }

    vec3 ditherQuant(vec2 uv, vec3 color){
      vec2 scaledCoord = floor(uv * resolution / pixelSize);
      float threshold = bayer8(scaledCoord) - 0.25;
      float stepv = 1.0 / (colorNum - 1.0);
      color += threshold * stepv;
      float bias = 0.2;
      color = clamp(color - bias, 0.0, 1.0);
      return floor(color * (colorNum - 1.0) + 0.5) / (colorNum - 1.0);
    }

    void main(){
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      vec2 p = uv - 0.5;
      p.x *= resolution.x / resolution.y;
      float f = pattern(p);

      if (enableMouseInteraction == 1) {
        vec2 mouseNDC = (mousePos / resolution - 0.5) * vec2(1.0, -1.0);
        mouseNDC.x *= resolution.x / resolution.y;
        float dist = length(p - mouseNDC);
        float effect = 1.0 - smoothstep(0.0, mouseRadius, dist);
        f -= 0.5 * effect;
      }

      vec3 col = mix(vec3(0.0), waveColor, f);
      col = ditherQuant(uv, col);
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const prog = gl.createProgram();
  const vsh = compile(gl.VERTEX_SHADER, vs);
  const fsh = compile(gl.FRAGMENT_SHADER, fs);
  if (!vsh || !fsh) return;
  gl.attachShader(prog, vsh);
  gl.attachShader(prog, fsh);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    return;
  }

  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(prog, "position");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(prog, "resolution");
  const uTime = gl.getUniformLocation(prog, "time");
  const uWaveSpeed = gl.getUniformLocation(prog, "waveSpeed");
  const uWaveFrequency = gl.getUniformLocation(prog, "waveFrequency");
  const uWaveAmplitude = gl.getUniformLocation(prog, "waveAmplitude");
  const uWaveColor = gl.getUniformLocation(prog, "waveColor");
  const uMousePos = gl.getUniformLocation(prog, "mousePos");
  const uEnableMouse = gl.getUniformLocation(prog, "enableMouseInteraction");
  const uMouseRadius = gl.getUniformLocation(prog, "mouseRadius");
  const uColorNum = gl.getUniformLocation(prog, "colorNum");
  const uPixelSize = gl.getUniformLocation(prog, "pixelSize");

  let dpr = 1;
  const mouse = { x: 0, y: 0 };

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uResolution, canvas.width, canvas.height);
  }

  resize();
  window.addEventListener("resize", resize);

  window.addEventListener("pointermove", (e) => {
    if (!CONFIG.enableMouseInteraction) return;
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * dpr;
    mouse.y = (e.clientY - rect.top) * dpr;
  }, { passive: true });

  gl.uniform1f(uWaveSpeed, CONFIG.waveSpeed);
  gl.uniform1f(uWaveFrequency, CONFIG.waveFrequency);
  gl.uniform1f(uWaveAmplitude, CONFIG.waveAmplitude);
  gl.uniform3f(uWaveColor, CONFIG.waveColor[0], CONFIG.waveColor[1], CONFIG.waveColor[2]);
  gl.uniform1i(uEnableMouse, CONFIG.enableMouseInteraction ? 1 : 0);
  gl.uniform1f(uMouseRadius, CONFIG.mouseRadius);
  gl.uniform1f(uColorNum, CONFIG.colorNum);
  gl.uniform1f(uPixelSize, CONFIG.pixelSize);

  const t0 = performance.now();
  function frame(now) {
    resize();
    const t = (now - t0) / 1000;
    gl.uniform1f(uTime, CONFIG.disableAnimation ? 0.0 : t);
    gl.uniform2f(uMousePos, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* Projects detail panel */
(() => {
  const worksWrap = document.getElementById("works");
  if (!worksWrap) return;

  const cards = Array.from(worksWrap.querySelectorAll(".work[data-work]"));
  const openBtns = Array.from(worksWrap.querySelectorAll("[data-open]"));
  const panel = document.getElementById("workDetail");
  const closeBtn = document.getElementById("workDetailClose");
  const kEl = document.getElementById("workDetailK");
  const metaEl = document.getElementById("workDetailMeta");
  const titleEl = document.getElementById("workDetailTitle");
  const descEl = document.getElementById("workDetailDesc");
  const bulletsEl = document.getElementById("workDetailBullets");
  const mediaEl = document.getElementById("workDetailMedia");

  if (!panel || !openBtns.length) return;

  const PROJECTS = {
    fr: [
      {
        id: "p1",
        k: "PROJECT_01",
        meta: "SAÉ / 2025",
        title: "Fabrication d'une pièce unitaire",
        desc: "Situation d'Apprentissage et d'Évaluation : conception CATIA, simulation + gamme VBend, documents découpe, fabrication presse plieuse.",
        bullets: [
          "Conception de l'idée (voiture) — CATIA",
          "Développé de la pièce — CATIA",
          "Gamme de pliage — VBend",
          "Simulation — VBend",
          "Envoi documents pour découpe",
          "Fabrication / pliage — presse plieuse",
        ],
        images: [
          { src: "/images/projets/tole-1.png", cap: "Modèle CAO" },
          { src: "/images/projets/tole-2.png", cap: "Simulation" },
          { src: "/images/projets/tole-3.png", cap: "Pièce finie" },
        ],
      },
      {
        id: "p2",
        k: "PROJECT_02",
        meta: "SAÉ / 2026",
        title: "Foil",
        desc: "Réalisation d'un foil en surfacique et de son moule sur CATIA : courbes guides, nuage de points, sections/surfaces, paramétrage du congé.",
        bullets: [
          "Traçage des courbes guides",
          "Importation nuage de point",
          "Modélisation sections et surfaces",
          "Paramétrage du congé",
          "Conception moule",
        ],
        images: [
          { src: "/images/projets/foil-2.png", cap: "Moule" },
          { src: "/images/projets/foil-1.png", cap: "Surfacique" },
        ],
      },
    ],
    en: [
      {
        id: "p1",
        k: "PROJECT_01",
        meta: "PROJECT / 2025",
        title: "Manufacturing of a single part",
        desc: "Learning and assessment project: CATIA design, VBend simulation and bending range, cutting documents, and press brake manufacturing.",
        bullets: [
          "Concept design (car) — CATIA",
          "Part flat pattern — CATIA",
          "Bending sequence — VBend",
          "Simulation — VBend",
          "Sending documents for cutting",
          "Manufacturing / bending — press brake",
        ],
        images: [
          { src: "/images/projets/tole-1.png", cap: "CAD model" },
          { src: "/images/projets/tole-2.png", cap: "Simulation" },
          { src: "/images/projets/tole-3.png", cap: "Finished part" },
        ],
      },
      {
        id: "p2",
        k: "PROJECT_02",
        meta: "PROJECT / 2026",
        title: "Foil",
        desc: "Creation of a surfacing foil and its mold in CATIA: guide curves, point cloud, sections/surfaces, and fillet parameterization.",
        bullets: [
          "Guide curve tracing",
          "Point cloud import",
          "Section and surface modeling",
          "Fillet parameterization",
          "Mold design",
        ],
        images: [
          { src: "/images/projets/foil-2.png", cap: "Mold" },
          { src: "/images/projets/foil-1.png", cap: "Surfacing" },
        ],
      },
    ],
  };

  let openedId = null;
  let currentLang = "fr";

  const setHeight = (el, value) => {
    el.style.height = typeof value === "number" ? `${value}px` : value;
  };

  const render = (p) => {
    if (!p) return;
    if (kEl) kEl.textContent = p.k;
    if (metaEl) metaEl.textContent = p.meta;
    if (titleEl) titleEl.textContent = p.title;
    if (descEl) descEl.textContent = p.desc;
    if (bulletsEl) bulletsEl.innerHTML = `<ul>${p.bullets.map((x) => `<li>${x}</li>`).join("")}</ul>`;
    if (mediaEl) {
      mediaEl.innerHTML = p.images.map((img) => {
        const cap = (img.cap || "").trim().toLowerCase();
        const isPieceFinie = cap === "pièce finie" || cap === "finished part";
        return `
          <figure class="${isPieceFinie ? "is-piece-finie" : ""}">
            <img loading="lazy" src="${img.src}" alt="" />
            <figcaption>${img.cap || "—"}</figcaption>
          </figure>
        `;
      }).join("");
    }
  };

  const selectCard = (id) => {
    cards.forEach((c) => c.classList.toggle("is-selected", c.dataset.id === id));
    openBtns.forEach((b) => b.setAttribute("aria-expanded", b.dataset.open === id ? "true" : "false"));
  };

  const openPanel = (id) => {
    const p = PROJECTS[currentLang].find((x) => x.id === id);
    if (!p) return;

    if (openedId === id) {
      closePanel();
      return;
    }

    openedId = id;
    render(p);
    selectCard(id);

    panel.hidden = false;
    panel.classList.add("is-on");
    setHeight(panel, 0);

    requestAnimationFrame(() => setHeight(panel, panel.scrollHeight));
    const onEnd = (e) => {
      if (e.propertyName !== "height") return;
      panel.style.height = "auto";
      panel.removeEventListener("transitionend", onEnd);
    };
    panel.addEventListener("transitionend", onEnd);
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const closePanel = () => {
    if (panel.hidden) return;
    openedId = null;
    selectCard(null);

    setHeight(panel, panel.scrollHeight);
    requestAnimationFrame(() => setHeight(panel, 0));

    const onEnd = (e) => {
      if (e.propertyName !== "height") return;
      panel.classList.remove("is-on");
      panel.hidden = true;
      panel.style.height = "0px";
      panel.removeEventListener("transitionend", onEnd);
    };
    panel.addEventListener("transitionend", onEnd);
  };

  openBtns.forEach((btn) => btn.addEventListener("click", () => openPanel(btn.dataset.open)));
  closeBtn?.addEventListener("click", closePanel);
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(); });

  window.__setProjectsLang = (lang) => {
    currentLang = lang;
    if (!openedId) return;
    const current = PROJECTS[currentLang].find((x) => x.id === openedId);
    if (current) render(current);
  };
})();

/* Earth canvas */
const topojson = window.topojson;
const earthCanvas = document.getElementById("earth-canvas");
const ctx = earthCanvas?.getContext("2d");
const loadEl = document.getElementById("loading");

let offCanvas = null;
let offCtx = null;
let W, H, R, cx, cy;

function resizeEarth() {
  if (!earthCanvas || !ctx) return;
  W = earthCanvas.width = window.innerWidth;
  H = earthCanvas.height = window.innerHeight;
  R = Math.min(W, H) * 0.18;
  cx = W / 2;
  cy = H / 2;
  offCanvas = document.createElement("canvas");
  offCanvas.width = W;
  offCanvas.height = H;
  offCtx = offCanvas.getContext("2d");
}

resizeEarth();
window.addEventListener("resize", () => { resizeEarth(); scheduleDraw(); });

function project(lon, lat, rotLon, rotLat) {
  const D = Math.PI / 180;
  const λ = (lon - rotLon) * D;
  const φ = lat * D;
  const φc = rotLat * D;

  const cosφ = Math.cos(φ), sinφ = Math.sin(φ), cosλ = Math.cos(λ), sinλ = Math.sin(λ), cosφc = Math.cos(φc), sinφc = Math.sin(φc);
  const z = sinφ * sinφc + cosφ * cosλ * cosφc;
  if (z < 0) return null;
  return { nx: cosφ * sinλ, ny: -(sinφ * cosφc - cosφ * cosλ * sinφc), z };
}

let coastlines = null;

async function initEarth() {
  if (!earthCanvas || !ctx || !topojson) return;
  if (loadEl) loadEl.textContent = getI18nValue("work.loading");
  const res = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json");
  const topo = await res.json();
  const land = topojson.feature(topo, topo.objects.land);
  const rings = [];

  function extractRings(geom) {
    if (!geom) return;
    if (geom.type === "Polygon") rings.push(...geom.coordinates);
    else if (geom.type === "MultiPolygon") for (const poly of geom.coordinates) for (const ring of poly) rings.push(ring);
    else if (geom.type === "GeometryCollection") for (const g of geom.geometries) extractRings(g);
  }

  if (land.features) for (const f of land.features) extractRings(f.geometry);
  else extractRings(land.geometry || land);

  coastlines = rings;
  if (loadEl) loadEl.style.display = "none";
  drawEarth(currentLon, currentLat, currentZoom);
}

let currentLon = 80;
let currentLat = 20;
let currentZoom = 1.0;

function drawEarth(rotLon, rotLat, zoom) {
  if (!ctx || !offCtx || !coastlines) return;
  offCtx.clearRect(0, 0, W, H);

  offCtx.beginPath();
  offCtx.arc(cx, cy, R * zoom, 0, Math.PI * 2);
  offCtx.fillStyle = "rgba(18,18,20,1.0)";
  offCtx.fill();

  function traceRing(ring) {
    let interrupted = false;
    let first = true;
    offCtx.beginPath();
    for (const [lon, lat] of ring) {
      const p = project(lon, lat, rotLon, rotLat);
      if (!p) { first = true; interrupted = true; continue; }
      const sx = cx + p.nx * R * zoom;
      const sy = cy + p.ny * R * zoom;
      if (first) { offCtx.moveTo(sx, sy); first = false; }
      else offCtx.lineTo(sx, sy);
    }
    return !interrupted;
  }

  for (const ring of coastlines) {
    const complete = traceRing(ring);
    if (complete) offCtx.closePath();
  }

  offCtx.lineWidth = zoom > 3 ? 0.7 : 0.55;
  offCtx.strokeStyle = "rgba(255,255,255,0.72)";
  offCtx.lineJoin = "round";
  offCtx.lineCap = "round";

  for (const ring of coastlines) { traceRing(ring); offCtx.stroke(); }

  const SERMETA_LON = -3.833;
  const SERMETA_LAT = 48.577;
  const markerOpacity = Math.max(0, Math.min(1, (zoom - 9) / 3));

  if (markerOpacity > 0) {
    const bp = project(SERMETA_LON, SERMETA_LAT, rotLon, rotLat);
    if (bp && bp.z > 0.01) {
      const mx = cx + bp.nx * R * zoom;
      const my = cy + bp.ny * R * zoom;
      const now = Date.now();

      offCtx.beginPath();
      offCtx.arc(mx, my, 3.5, 0, Math.PI * 2);
      offCtx.fillStyle = `rgba(255,255,255,${markerOpacity})`;
      offCtx.fill();

      const crossLen = 10 * markerOpacity;
      offCtx.strokeStyle = `rgba(255,255,255,${markerOpacity * 0.7})`;
      offCtx.lineWidth = 0.9;
      offCtx.beginPath(); offCtx.moveTo(mx - crossLen, my); offCtx.lineTo(mx + crossLen, my); offCtx.stroke();
      offCtx.beginPath(); offCtx.moveTo(mx, my - crossLen); offCtx.lineTo(mx, my + crossLen); offCtx.stroke();

      for (let i = 0; i < 3; i++) {
        const period = 2400;
        const offset = i * (period / 3);
        const t = ((now + offset) % period) / period;
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const radius = 6 + eased * 28;
        const alpha = markerOpacity * (1 - t) * 0.55;
        offCtx.beginPath();
        offCtx.arc(mx, my, radius, 0, Math.PI * 2);
        offCtx.strokeStyle = `rgba(255,255,255,${alpha})`;
        offCtx.lineWidth = 0.8;
        offCtx.stroke();
      }

      const LABEL = "SERMETA";
      const SUBLABEL = "MORLAIX · 48°34'N · 3°50'O";
      const labelX = mx + 18;
      const labelY = my - 10;
      const textStartOpacity = 0.18;
      const textProgress = Math.max(0, Math.min(1, (markerOpacity - textStartOpacity) / (1 - textStartOpacity)));
      const totalDuration = 3200;
      const mainDuration = 1450;
      const gapDuration = 220;
      const subDuration = 1530;
      const elapsed = textProgress * totalDuration;
      const caret = Math.floor(now / 500) % 2 === 0 ? "▌" : "";

      const mainProgress = Math.max(0, Math.min(1, elapsed / mainDuration));
      const charsMain = Math.floor(mainProgress * LABEL.length);
      const subElapsed = elapsed - mainDuration - gapDuration;
      const subProgress = Math.max(0, Math.min(1, subElapsed / subDuration));
      const charsSub = Math.floor(subProgress * SUBLABEL.length);

      offCtx.font = "bold 13px 'IBM Plex Mono', monospace";
      offCtx.fillStyle = `rgba(255,255,255,${markerOpacity * 0.95})`;
      const mainDone = charsMain >= LABEL.length;
      const displayMain = LABEL.slice(0, charsMain) + (!mainDone ? caret : "");
      offCtx.fillText(displayMain, labelX, labelY);

      if (elapsed > mainDuration) {
        offCtx.font = "10px 'IBM Plex Mono', monospace";
        offCtx.fillStyle = `rgba(255,255,255,${markerOpacity * 0.45})`;
        const subDone = charsSub >= SUBLABEL.length;
        const displaySub = SUBLABEL.slice(0, charsSub) + (mainDone && !subDone ? caret : "");
        offCtx.fillText(displaySub, labelX, labelY + 16);
      }
    }
  }

  const fadeStart = R * 0.45;
  const fadeEnd = R * 2.2;
  offCtx.globalCompositeOperation = "destination-out";
  const mask = offCtx.createRadialGradient(cx, cy, fadeStart, cx, cy, fadeEnd);
  mask.addColorStop(0.0, "rgba(0,0,0,0)");
  mask.addColorStop(0.28, "rgba(0,0,0,0)");
  mask.addColorStop(0.52, "rgba(0,0,0,0.08)");
  mask.addColorStop(0.68, "rgba(0,0,0,0.22)");
  mask.addColorStop(0.8, "rgba(0,0,0,0.48)");
  mask.addColorStop(0.9, "rgba(0,0,0,0.72)");
  mask.addColorStop(0.96, "rgba(0,0,0,0.90)");
  mask.addColorStop(1.0, "rgba(0,0,0,1.0)");
  offCtx.fillStyle = mask;
  offCtx.fillRect(0, 0, W, H);
  offCtx.globalCompositeOperation = "source-over";

  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(offCanvas, 0, 0);
}

let targetLon = 80, targetLat = 20, targetZoom = 1.0, animLon = 80, animLat = 20, animZoom = 1.0, rafId = null, markerRafId = null;

function startMarkerLoop() {
  if (markerRafId) return;
  const loop = () => { drawEarth(currentLon, currentLat, currentZoom); markerRafId = requestAnimationFrame(loop); };
  markerRafId = requestAnimationFrame(loop);
}
function stopMarkerLoop() {
  if (!markerRafId) return;
  cancelAnimationFrame(markerRafId);
  markerRafId = null;
}
function animLoop() {
  stopMarkerLoop();
  animLon += (targetLon - animLon) * 0.07;
  animLat += (targetLat - animLat) * 0.07;
  animZoom += (targetZoom - animZoom) * 0.055;
  currentLon = animLon; currentLat = animLat; currentZoom = animZoom;
  drawEarth(currentLon, currentLat, currentZoom);

  const d = Math.abs(targetLon - animLon) + Math.abs(targetLat - animLat) + Math.abs(targetZoom - animZoom);
  if (d > 0.005) rafId = requestAnimationFrame(animLoop);
  else {
    rafId = null;
    currentLon = targetLon; currentLat = targetLat; currentZoom = targetZoom;
    drawEarth(currentLon, currentLat, currentZoom);
    if (currentZoom > 9) startMarkerLoop();
  }
}
function scheduleDraw() { if (!rafId) rafId = requestAnimationFrame(animLoop); }

const earthSection = document.getElementById("earth-section");
const eio = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
const lerp = (a, b, t) => a + (b - a) * t;

function updateEarthFromScroll() {
  if (!earthSection || !earthCanvas) return;
  const rect = earthSection.getBoundingClientRect();
  const total = earthSection.offsetHeight - window.innerHeight;
  if (total <= 0) return;
  const p = Math.max(0, Math.min(1, -rect.top / total));

  if (p < 0.22) {
    const t = eio(p / 0.22);
    targetLon = lerp(80, -3.833, t);
    targetLat = lerp(20, 48.577, t);
    targetZoom = lerp(1.0, 1.8, t);
  } else if (p < 0.46) {
    const t = eio((p - 0.22) / 0.24);
    targetLon = -3.833; targetLat = 48.577; targetZoom = lerp(1.8, 5.2, t);
  } else if (p < 0.68) {
    const t = eio((p - 0.46) / 0.22);
    targetLon = -3.833; targetLat = 48.577; targetZoom = lerp(5.2, 10.5, t);
  } else if (p < 0.82) {
    const t = eio((p - 0.68) / 0.14);
    targetLon = -3.833; targetLat = 48.577; targetZoom = lerp(10.5, 14.5, t);
  } else {
    const t = eio((p - 0.82) / 0.18);
    targetLon = -3.833; targetLat = 48.577; targetZoom = lerp(14.5, 40, t);
  }
  scheduleDraw();
}
window.addEventListener("scroll", updateEarthFromScroll, { passive: true });
window.addEventListener("resize", updateEarthFromScroll);
updateEarthFromScroll();

/* I18N */
const I18N = {
  fr: {
    "sys.portfolio": "Portfolio",
    "nav.indexBtn": "Index",
    "nav.chapters": "Chapitres",
    "nav.indexTitle": "Index",
    "nav.home": "01 — Home",
    "nav.about": "02 — À propos",
    "nav.skills": "03 — Compétences",
    "nav.work": "04 — Alternance / Stage",
    "nav.edu": "05 — Formation",
    "nav.xp": "06 — Expérience",
    "nav.projects": "07 — Projets",
    "nav.interests": "08 — Intérêts",
    "nav.contact": "09 — Contact",
    "nav.homeShort": "Home",
    "nav.aboutShort": "À propos",
    "nav.skillsShort": "Compétences",
    "nav.workShort": "Alternance / Stage",
    "nav.eduShort": "Formation",
    "nav.xpShort": "Expérience",
    "nav.projectsShort": "Projets",
    "nav.interestsShort": "Intérêts",
    "nav.contactShort": "Contact",
    "nav.scroll": "Scroll ▾",
    "actions.cv": "CV",
    "actions.openCv": "Ouvrir le CV",
    "home.top1": "Alternant — Sermeta",
    "home.top3": "Portfolio",
    "home.title": `Le Génie Mécanique et Productique<br /><span class="title__accent">appliqué</span> chez Sermeta<br />`,
    "home.lead": "De l'étude complète à la fabrication en atelier",
    "home.ctaProjects": "Open projects",
    "home.ctaContact": "Contact",
    "about.title": "À propos",
    "about.p1": "Étudiant en deuxième année de Génie Mécanique et Productique à l’IUT de Brest, je développe des compétences telles que la conception mécanique, le dessin industriel, la métrologie…",
    "about.p2": "En alternance chez Sermeta à Morlaix, j’évolue en tant que dessinateur process, où je contribue à l’optimisation et la mise en œuvre de nouveaux procédés de fabrication.",
    "about.table.status": "Statut",
    "about.table.statusValue": "Alternant",
    "about.table.company": "Entreprise",
    "about.table.degree": "Diplôme prévu",
    "skills.title": "Compétences",
    "skills.projectsBtn": "Voir projets →",
    "skills.cards.0.title": "CAO, FAO & mise en plan",
    "skills.cards.0.text": "Conception & Fabrication Assistées par Ordinateur, dessin 2D avec le logiciel CATIA",
    "skills.cards.0.chip1": "Modélisation 3D",
    "skills.cards.0.chip2": "Simulation",
    "skills.cards.0.chip3": "Mise en plan 2D",
    "skills.cards.1.title": "Conception mécanique",
    "skills.cards.1.tag": "Étude",
    "skills.cards.1.text": "Analyse & cotation fonctionnelle, choix techniques, tolérances, logique d'assemblage",
    "skills.cards.1.chip1": "Analyse",
    "skills.cards.1.chip2": "Choix techniques",
    "skills.cards.1.chip3": "Logique de montage",
    "skills.cards.2.title": "Usinage & chaudronnerie",
    "skills.cards.2.tag": "Atelier",
    "skills.cards.2.text": "Soudage, pliage de tôle, tournage, fraisage et perçage (conventionnels & numériques)",
    "skills.cards.2.chip1": "Usinage",
    "skills.cards.2.chip2": "Pliage & découpe",
    "skills.cards.3.title": "Production méthodes",
    "skills.cards.3.tag": "Méthodes",
    "skills.cards.3.text": "Réalisation des documents nécessaire à la fabrication, analyse fonctionnelle du dessin, recherche de solutions de fabrication.",
    "skills.cards.3.chip1": "Procédés",
    "skills.cards.3.chip2": "Analyse",
    "skills.cards.3.chip3": "APEF / Cph",
    "skills.board.eyebrow": "Référentiel de compétences",
    "skills.board.title": "Niveaux de développement des compétences",
    "skills.board.program1": "B.U.T. Génie mécanique et productique",
    "skills.board.program2": "Parcours Innovation pour l'industrie",
    "skills.board.level1": "Niveau 1",
    "skills.board.level2": "Niveau 2",
    "skills.board.level3": "Niveau 3",
    "skills.board.cols.specify": "Spécifier",
    "skills.board.cols.develop": "Développer",
    "skills.board.cols.realize": "Réaliser",
    "skills.board.cols.operate": "Exploiter",
    "skills.board.cols.innovate": "Innover",
    "skills.board.specify.1": "Identifier le besoin d’un client dans un cas simple",
    "skills.board.specify.2": "Identifier le besoin d’un client dans un contexte industriel en collaboration",
    "skills.board.specify.3": "Identifier le besoin d’un client dans un contexte industriel",
    "skills.board.develop.1": "Proposer des solutions dans un cas simple",
    "skills.board.develop.2": "Proposer des solutions dans un cas complexe",
    "skills.board.develop.3": "Proposer des solutions validées",
    "skills.board.realize.1": "Concrétiser une solution simple",
    "skills.board.realize.2": "Concrétiser une solution complexe en collaboration",
    "skills.board.realize.3": "Concrétiser une solution complexe",
    "skills.board.operate.1": "Identifier les sources d’information pertinentes en entreprise",
    "skills.board.operate.2": "Utiliser les outils permettant d’évaluer les performances",
    "skills.board.operate.3": "Mettre en œuvre une amélioration selon une démarche structurée",
    "skills.board.innovate.1": "Expérimenter une démarche d’innovation",
    "skills.board.innovate.2": "Participer activement à une démarche d’innovation",
    "work.loading": "Chargement…",
    "work.title": "Alternance / Stage",
    "work.tabs.alt": "Alternance",
    "work.tabs.stage": "Stage",
    "work.box.missions": "Missions",
    "work.box.goals": "Objectifs",
    "work.alt.role": "DESSINATEUR PROCESS",
    "work.alt.desc": "Dans le cadre de l’obtention du BUT, une alternance doit être réalisée à partir de la deuxième (mon cas) ou troisième année. En alternance chez Sermeta, je participe à l’amélioration des moyens de fabrication existants et à la conception de nouveaux équipements.",
    "work.alt.m1": "Conception 3D & mise en plan",
    "work.alt.m2": "Optimisation d’outillages / montages",
    "work.alt.m3": "Recherche de solutions",
    "work.alt.o1": "Réduction d’un temps de manipulation / simplification d’un montage",
    "work.alt.o2": "Fiabiliser un système",
    "work.alt.o3": "Conception de nouveaux équipements",
    "work.stage.role": "STAGE OPÉRATEUR",
    "work.stage.desc": "Dans le cadre de la validation de ma première année de BUT GMP, j’ai effectué un stage opérateur de trois semaines chez Oxymax. L’entreprise couvre plusieurs domaines du GMP : pliage, découpe, chaudronnerie ainsi qu'un bureau d'études et de méthodes. J’ai travaillé en tant qu'opérateur en découpe laser/oxycoupage, en pliage et en chaudronnerie.",
    "work.stage.m1": "Chargement/déchargement des tôles",
    "work.stage.m2": "Ébavurage & finition (acier, inox, alu)",
    "work.stage.m3": "Pliage de tôles",
    "work.stage.o1": "Comprendre le fonctionnement d’une entreprise",
    "work.stage.o2": "Découvrir les services",
    "work.stage.o3": "Comprendre les risques opérateur",
    "edu.title": "Formation",
    "edu.live": "En cours",
    "edu.done": "Obtenu",
    "edu.i1.title": "BUT Génie Mécanique & Productique",
    "edu.i1.place": "IUT, Brest",
    "edu.i2.title": "Brevet d'Initiation à la Mer (BIMer)",
    "edu.i2.place": "IUT, Brest",
    "edu.i3.title": "Baccalauréat général",
    "edu.i3.place": "Lycée de l'Elorn, Landerneau",
    "edu.i4.title": "Epreuves Anticipées de Français (EAF)",
    "edu.i4.place": "Lycée de l'Elorn, Landerneau",
    "edu.i5.title": "Brevet d'Initiation à l'Aéronautique",
    "edu.i5.place": "Aéroclub, Guipavas",
    "xp.title": "Expérience pro",
    "xp.summer2025": "Été 2025",
    "xp.summer2024": "Été 2024",
    "xp.summer2023": "Été 2023",
    "xp.summer2022": "Été 2022",
    "xp.summer2021": "Été 2021",
    "xp.i1.title": "Employé Espaces Verts",
    "xp.i1.place": "Services Techniques, Landerneau",
    "xp.i2.title": "Employé Signalisation",
    "xp.i2.place": "Services Techniques, Landerneau",
    "xp.i3.title": "Emploi saisonnier — Échalotes",
    "xp.i3.place": "ETA LEOST, Plouedern",
    "xp.i4.title": "Emploi saisonnier — Échalotes",
    "xp.i4.place": "ETA LEOST, Plouedern",
    "xp.i5.title": "Emploi saisonnier — Échalotes",
    "xp.i5.place": "ETA LEOST, Plouedern",
    "projects.title": "Projets",
    "projects.open": "Ouvrir",
    "projects.close": "Fermer",
    "projects.inProgress": "EN COURS",
    "projects.p1.title": "Fabrication d'une pièce unitaire",
    "projects.p1.desc": "Fabrication d'une pièce en tôle pliée",
    "projects.p1.meta": "Conception / Gamme / Pliage",
    "projects.p2.title": "Foil",
    "projects.p2.desc": "Conception d'un foil et de son moule",
    "projects.p2.meta": "Surfacique / Foil / Modélisation",
    "projects.p3.title": "Projet arçon de voltige",
    "projects.p3.desc": "Objectif : Concevoir et fabriquer un arçon de voltige à partir d’un scan 3D d'un dos de cheval, afin de répondre aux besoins du cascadeur tout en garantissant le confort de l’animal. L’arçon devra épouser parfaitement la morphologie du cheval.",
    "projects.p3.meta": "Scan 3D / CATIA / Prototypage / Fabrication",
    "interests.title": "Centres d’intérêt",
    "interests.i1.title": "Sport auto",
    "interests.i1.text": "stratégie / aérodynamique",
    "interests.i2.title": "Aéronautique",
    "interests.i2.text": "mécanique / aérodynamique",
    "interests.i3.title": "Running",
    "interests.i3.text": "endurance / dépassement de soi",
    "interests.i4.title": "Modélisme",
    "interests.i4.text": "assemblage",
    "interests.i5.title": "Photographie",
    "interests.i5.text": "capture du moment / style",
    "interests.i6.title": "Mécanique",
    "interests.i6.text": "fonctionnement / systèmes",
    "interests.i7.title": "Voyages",
    "interests.i7.text": "découverte",
    "interests.i8.title": "Bivouac",
    "interests.i8.text": "liberté",
    "contact.title": "Contact",
    "contact.p1": "Pour me contacter,",
    "contact.p2": "il suffit de cliquer sur le mail ou le bouton LinkedIn ci-dessous.",
    "contact.table.status": "Statut",
    "contact.table.statusValue": "Alternant",
    "contact.table.training": "Formation",
    "contact.table.company": "Entreprise",
    "contact.table.role": "Rôle",
    "contact.table.roleValue": "Dessinateur process",
  },
  en: {
    "sys.portfolio": "Portfolio",
    "nav.indexBtn": "Index",
    "nav.chapters": "Chapters",
    "nav.indexTitle": "Index",
    "nav.home": "01 — Home",
    "nav.about": "02 — About",
    "nav.skills": "03 — Skills",
    "nav.work": "04 — Work / Internship",
    "nav.edu": "05 — Education",
    "nav.xp": "06 — Experience",
    "nav.projects": "07 — Projects",
    "nav.interests": "08 — Interests",
    "nav.contact": "09 — Contact",
    "nav.homeShort": "Home",
    "nav.aboutShort": "About",
    "nav.skillsShort": "Skills",
    "nav.workShort": "Work / Internship",
    "nav.eduShort": "Education",
    "nav.xpShort": "Experience",
    "nav.projectsShort": "Projects",
    "nav.interestsShort": "Interests",
    "nav.contactShort": "Contact",
    "nav.scroll": "Scroll ▾",
    "actions.cv": "Resume",
    "actions.openCv": "Open resume",
    "home.top1": "Apprentice — Sermeta",
    "home.top3": "Portfolio",
    "home.title": `Mechanical and Production Engineering<br /><span class="title__accent">applied</span> at Sermeta<br />`,
    "home.lead": "From full design studies to workshop manufacturing",
    "home.ctaProjects": "Open projects",
    "home.ctaContact": "Contact",
    "about.title": "About",
    "about.p1": "Second-year Mechanical and Production Engineering student at the IUT of Brest, developing skills in mechanical design, industrial drawing, metrology, and more.",
    "about.p2": "As an apprentice at Sermeta in Morlaix, I work as a process drafter, contributing to the optimization and implementation of new manufacturing processes.",
    "about.table.status": "Status",
    "about.table.statusValue": "Apprentice",
    "about.table.company": "Company",
    "about.table.degree": "Expected degree",
    "skills.title": "Skills",
    "skills.projectsBtn": "See projects →",
    "skills.cards.0.title": "CAD, CAM & technical drawings",
    "skills.cards.0.text": "Computer-Aided Design and Manufacturing, 2D drawing with CATIA",
    "skills.cards.0.chip1": "3D modeling",
    "skills.cards.0.chip2": "Simulation",
    "skills.cards.0.chip3": "2D drawings",
    "skills.cards.1.title": "Mechanical design",
    "skills.cards.1.tag": "Study",
    "skills.cards.1.text": "Functional analysis and dimensioning, technical choices, tolerances, assembly logic",
    "skills.cards.1.chip1": "Analysis",
    "skills.cards.1.chip2": "Technical choices",
    "skills.cards.1.chip3": "Assembly logic",
    "skills.cards.2.title": "Machining & sheet metal work",
    "skills.cards.2.tag": "Workshop",
    "skills.cards.2.text": "Welding, sheet metal bending, turning, milling and drilling (conventional & CNC)",
    "skills.cards.2.chip1": "Machining",
    "skills.cards.2.chip2": "Bending & cutting",
    "skills.cards.3.title": "Production methods",
    "skills.cards.3.tag": "Methods",
    "skills.cards.3.text": "Preparation of manufacturing documents, functional drawing analysis, and search for manufacturing solutions.",
    "skills.cards.3.chip1": "Processes",
    "skills.cards.3.chip2": "Analysis",
    "skills.cards.3.chip3": "APEF / Cph",
    "skills.board.eyebrow": "Skills framework",
    "skills.board.title": "Competency development levels",
    "skills.board.program1": "B.U.T. Mechanical and Production Engineering",
    "skills.board.program2": "Innovation for Industry pathway",
    "skills.board.level1": "Level 1",
    "skills.board.level2": "Level 2",
    "skills.board.level3": "Level 3",
    "skills.board.cols.specify": "Specify",
    "skills.board.cols.develop": "Develop",
    "skills.board.cols.realize": "Build",
    "skills.board.cols.operate": "Operate",
    "skills.board.cols.innovate": "Innovate",
    "skills.board.specify.1": "Identify a client need in a simple case",
    "skills.board.specify.2": "Identify a client need in an industrial context with collaboration",
    "skills.board.specify.3": "Identify a client need in an industrial context",
    "skills.board.develop.1": "Propose solutions in a simple case",
    "skills.board.develop.2": "Propose solutions in a complex case",
    "skills.board.develop.3": "Propose validated solutions",
    "skills.board.realize.1": "Implement a simple solution",
    "skills.board.realize.2": "Implement a complex solution collaboratively",
    "skills.board.realize.3": "Implement a complex solution",
    "skills.board.operate.1": "Identify relevant information sources in a company",
    "skills.board.operate.2": "Use tools to assess performance",
    "skills.board.operate.3": "Implement an improvement through a structured approach",
    "skills.board.innovate.1": "Experiment with an innovation approach",
    "skills.board.innovate.2": "Actively contribute to an innovation approach",
    "work.loading": "Loading…",
    "work.title": "Work / Internship",
    "work.tabs.alt": "Apprenticeship",
    "work.tabs.stage": "Internship",
    "work.box.missions": "Tasks",
    "work.box.goals": "Goals",
    "work.alt.role": "PROCESS DESIGNER",
    "work.alt.desc": "As part of the B.U.T. degree, an apprenticeship must be completed from the second year onward. At Sermeta, I contribute to improving existing manufacturing resources and designing new equipment.",
    "work.alt.m1": "3D design & drawings",
    "work.alt.m2": "Tooling / fixture optimization",
    "work.alt.m3": "Solution research",
    "work.alt.o1": "Reduce handling time / simplify a setup",
    "work.alt.o2": "Improve system reliability",
    "work.alt.o3": "Design new equipment",
    "work.stage.role": "OPERATOR INTERNSHIP",
    "work.stage.desc": "As part of validating my first year of the B.U.T. GMP, I completed a three-week operator internship at Oxymax. The company covers several GMP fields: bending, cutting, boilermaking, as well as design and methods offices. I worked as an operator in laser/oxy-fuel cutting, bending, and boilermaking.",
    "work.stage.m1": "Loading/unloading metal sheets",
    "work.stage.m2": "Deburring & finishing (steel, stainless steel, aluminum)",
    "work.stage.m3": "Sheet metal bending",
    "work.stage.o1": "Understand how a company operates",
    "work.stage.o2": "Discover the departments",
    "work.stage.o3": "Understand operator risks",
    "edu.title": "Education",
    "edu.live": "Ongoing",
    "edu.done": "Obtained",
    "edu.i1.title": "B.U.T. Mechanical & Production Engineering",
    "edu.i1.place": "IUT, Brest",
    "edu.i2.title": "BIMer (Marine Initiation Certificate)",
    "edu.i2.place": "IUT, Brest",
    "edu.i3.title": "General Baccalaureate",
    "edu.i3.place": "Lycée de l'Elorn, Landerneau",
    "edu.i4.title": "Early French Exams (EAF)",
    "edu.i4.place": "Lycée de l'Elorn, Landerneau",
    "edu.i5.title": "Aeronautics Initiation Certificate",
    "edu.i5.place": "Aéroclub, Guipavas",
    "xp.title": "Professional experience",
    "xp.summer2025": "Summer 2025",
    "xp.summer2024": "Summer 2024",
    "xp.summer2023": "Summer 2023",
    "xp.summer2022": "Summer 2022",
    "xp.summer2021": "Summer 2021",
    "xp.i1.title": "Green Spaces Employee",
    "xp.i1.place": "Technical Services, Landerneau",
    "xp.i2.title": "Signage Employee",
    "xp.i2.place": "Technical Services, Landerneau",
    "xp.i3.title": "Seasonal job — Shallots",
    "xp.i3.place": "ETA LEOST, Plouedern",
    "xp.i4.title": "Seasonal job — Shallots",
    "xp.i4.place": "ETA LEOST, Plouedern",
    "xp.i5.title": "Seasonal job — Shallots",
    "xp.i5.place": "ETA LEOST, Plouedern",
    "projects.title": "Projects",
    "projects.open": "Open",
    "projects.close": "Close",
    "projects.inProgress": "IN PROGRESS",
    "projects.p1.title": "Manufacturing of a single part",
    "projects.p1.desc": "Manufacturing of a bent sheet metal part",
    "projects.p1.meta": "Design / Bending sequence / Bending",
    "projects.p2.title": "Foil",
    "projects.p2.desc": "Design of a foil and its mold",
    "projects.p2.meta": "Surfacing / Foil / Modeling",
    "projects.p3.title": "Voltige saddle tree project",
    "projects.p3.desc": "Objective: design and manufacture a stunt saddle tree from a 3D scan of a horse’s back, meeting the stunt rider’s needs while ensuring the animal’s comfort. The saddle tree must perfectly match the horse’s morphology.",
    "projects.p3.meta": "3D scan / CATIA / Prototyping / Manufacturing",
    "interests.title": "Interests",
    "interests.i1.title": "Motorsport",
    "interests.i1.text": "strategy / aerodynamics",
    "interests.i2.title": "Aeronautics",
    "interests.i2.text": "mechanics / aerodynamics",
    "interests.i3.title": "Running",
    "interests.i3.text": "endurance / self-improvement",
    "interests.i4.title": "Model making",
    "interests.i4.text": "assembly",
    "interests.i5.title": "Photography",
    "interests.i5.text": "capturing the moment / style",
    "interests.i6.title": "Mechanics",
    "interests.i6.text": "operation / systems",
    "interests.i7.title": "Travel",
    "interests.i7.text": "discovery",
    "interests.i8.title": "Bivouac",
    "interests.i8.text": "freedom",
    "contact.title": "Contact",
    "contact.p1": "To contact me,",
    "contact.p2": "just click on the email address or the LinkedIn button below.",
    "contact.table.status": "Status",
    "contact.table.statusValue": "Apprentice",
    "contact.table.training": "Program",
    "contact.table.company": "Company",
    "contact.table.role": "Role",
    "contact.table.roleValue": "Process designer",
  },
};

let currentLang = localStorage.getItem("site-lang") || "fr";

function getI18nValue(key) {
  return I18N[currentLang]?.[key] ?? I18N.fr[key] ?? "";
}

function applyI18n() {
  document.documentElement.lang = currentLang;

  $$("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const value = getI18nValue(key);
    if (value) el.textContent = value;
  });

  $$("[data-i18n-html]").forEach((el) => {
    const key = el.dataset.i18nHtml;
    const value = getI18nValue(key);
    if (value) el.innerHTML = value;
  });

  const langBtn = $("#langBtn");
  if (langBtn) langBtn.textContent = currentLang === "fr" ? "EN" : "FR";
  document.title = currentLang === "fr" ? "Yohann Lazou — Portfolio" : "Yohann Lazou — Portfolio";
  window.__setProjectsLang?.(currentLang);
}

(() => {
  const btn = $("#langBtn");
  if (!btn) return;
  applyI18n();
  btn.addEventListener("click", () => {
    currentLang = currentLang === "fr" ? "en" : "fr";
    localStorage.setItem("site-lang", currentLang);
    applyI18n();
  });
})();

/* Init */
initEarth().catch((err) => {
  console.error(err);
  if (loadEl) loadEl.textContent = currentLang === "fr" ? "Erreur de chargement" : "Loading error";
});