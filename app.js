import { worlds } from "./worlds.js";
import { mountWorldViewer, preferQuality } from "./viewer.js";

const corridor = document.getElementById("corridor");
const stage = document.getElementById("stage");
const viewer = document.getElementById("viewer");
const title = document.getElementById("stage-title");
const place = document.getElementById("stage-place");
const status = document.getElementById("stage-status");
const marble = document.getElementById("marble-link");
const closeBtn = document.getElementById("close-stage");
const previewBtn = document.getElementById("quality-preview");
const standardBtn = document.getElementById("quality-standard");

let destroyViewer = null;
let currentWorld = null;
let currentQuality = preferQuality();

function doorFor(world) {
  const button = document.createElement("button");
  button.className = "door";
  button.type = "button";
  button.dataset.worldId = world.id;
  button.innerHTML = `
    <span class="frame">
      <img class="room" alt="" src="${world.thumbnailUrl}" data-pano="${world.panoramaUrl}">
      <span class="enter">走进去</span>
    </span>
    <span class="plate">
      <span>
        <h2>${world.name}</h2>
        <small>${world.place}</small>
      </span>
      <time datetime="${world.date.replaceAll(".", "-")}">${world.date}</time>
    </span>
  `;
  button.addEventListener("click", () => openWorld(world.id));
  return button;
}

function upgradePanoramas() {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const img = entry.target;
      const pano = img.dataset.pano;
      if (pano && img.src !== pano) img.src = pano;
      observer.unobserve(img);
    }
  }, { rootMargin: "200px" });
  document.querySelectorAll(".room").forEach((img) => observer.observe(img));
}

function setQualityButtons() {
  previewBtn.setAttribute("aria-pressed", String(currentQuality === "preview"));
  standardBtn.setAttribute("aria-pressed", String(currentQuality === "standard"));
}

async function loadViewer() {
  destroyViewer?.();
  destroyViewer = null;
  viewer.replaceChildren();
  status.textContent = "正在打开房间…";
  try {
    destroyViewer = await mountWorldViewer({
      container: viewer,
      world: currentWorld,
      quality: currentQuality,
      onStatus: (text) => { status.textContent = text; }
    });
    viewer.focus();
  } catch (error) {
    console.error(error);
    status.textContent = "三维暂时打不开，先看全景。去 Marble 可进原世界。";
    const img = document.createElement("img");
    img.src = currentWorld.panoramaUrl;
    img.alt = currentWorld.name;
    img.style.cssText = "width:100%;height:100%;object-fit:cover;";
    viewer.replaceChildren(img);
  }
}

function openWorld(id, quality) {
  const world = worlds.find((item) => item.id === id);
  if (!world) return;
  currentWorld = world;
  currentQuality = quality || preferQuality();
  title.textContent = world.name;
  place.textContent = `${world.place} · ${world.date}`;
  marble.href = world.marbleUrl;
  stage.hidden = false;
  stage.classList.add("open");
  document.body.style.overflow = "hidden";
  history.replaceState(null, "", `#${id}`);
  setQualityButtons();
  loadViewer();
}

function closeWorld() {
  destroyViewer?.();
  destroyViewer = null;
  currentWorld = null;
  stage.classList.remove("open");
  stage.hidden = true;
  document.body.style.overflow = "";
  if (location.hash) history.replaceState(null, "", location.pathname);
}

worlds.forEach((world) => corridor.append(doorFor(world)));
upgradePanoramas();

closeBtn.addEventListener("click", closeWorld);
previewBtn.addEventListener("click", () => {
  if (!currentWorld || currentQuality === "preview") return;
  currentQuality = "preview";
  setQualityButtons();
  loadViewer();
});
standardBtn.addEventListener("click", () => {
  if (!currentWorld || currentQuality === "standard") return;
  currentQuality = "standard";
  setQualityButtons();
  loadViewer();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && currentWorld) closeWorld();
});

const fromHash = location.hash.replace("#", "");
if (fromHash && worlds.some((world) => world.id === fromHash)) openWorld(fromHash);
