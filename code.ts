figma.showUI(__html__, { width: 480, height: 600, themeColors: true });

// ── Types ──────────────────────────────────────────────────────

interface PlaceholderMsg {
  type: "create-placeholder";
  url: string;
  label: string;
}

interface CardMsg {
  type: "create-card";
  url: string;
  label: string;
  title: string;
}

interface SetImageMsg {
  type: "set-thumbnail" | "set-favicon";
  cardId: string;
  imageBytes: number[];
}

interface ResizeMsg {
  type: "resize-panel";
  width: number;
  height: number;
}

interface SimpleMsg {
  type: "ui-ready";
}

type PluginMsg = PlaceholderMsg | CardMsg | SetImageMsg | ResizeMsg | SimpleMsg;

// ── Constants ──────────────────────────────────────────────────

const CARD_MAX_W = 480;
const THUMB_W = 120;
const THUMB_H = 90;

// ── Helpers ────────────────────────────────────────────────────

function lockAll(node: SceneNode) {
  node.locked = true;
  if ("children" in node) {
    for (const child of node.children) {
      lockAll(child);
    }
  }
}

// ── Placeholder (instant canvas feedback) ──────────────────────

async function createPlaceholder(url: string, label: string) {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  const card = figma.createFrame();
  card.name = `[Moodboard] Loading...`;
  card.resize(CARD_MAX_W, 90);
  card.fills = [{ type: "SOLID", color: { r: 0.98, g: 0.98, b: 0.98 } }];
  card.strokes = [{ type: "SOLID", color: { r: 0.98, g: 0.98, b: 0.98 } }];
  card.strokeWeight = 1;
  card.cornerRadius = 10;
  card.clipsContent = true;
  card.layoutMode = "HORIZONTAL";
  card.primaryAxisSizingMode = "FIXED";
  card.counterAxisSizingMode = "AUTO";
  card.counterAxisAlignItems = "CENTER";
  card.itemSpacing = 0;

  // Marker: sandbox finds this node by matching pending URL
  card.setPluginData("moodboard-pending", url);
  card.setPluginData("moodboard-url", url);
  card.setPluginData("moodboard-label", label);

  const thumb = figma.createFrame();
  thumb.name = "thumbnail";
  thumb.resize(THUMB_W, THUMB_H);
  thumb.fills = [{ type: "SOLID", color: { r: 0.88, g: 0.88, b: 0.88 } }];
  card.appendChild(thumb);
  thumb.layoutSizingHorizontal = "FIXED";
  thumb.layoutSizingVertical = "FILL";

  const info = figma.createFrame();
  info.name = "info";
  info.fills = [];
  info.layoutMode = "VERTICAL";
  info.primaryAxisSizingMode = "AUTO";
  info.counterAxisSizingMode = "AUTO";
  info.paddingTop = 14;
  info.paddingBottom = 14;
  info.paddingLeft = 16;
  info.paddingRight = 20;
  info.itemSpacing = 6;
  card.appendChild(info);
  info.layoutSizingHorizontal = "FILL";

  const loadingText = figma.createText();
  loadingText.fontName = { family: "Inter", style: "Regular" };
  loadingText.characters = "Fetching site info...";
  loadingText.fontSize = 12;
  loadingText.fills = [{ type: "SOLID", color: { r: 0.447, g: 0.447, b: 0.447 } }];
  info.appendChild(loadingText);

  const urlText = figma.createText();
  urlText.fontName = { family: "Inter", style: "Regular" };
  urlText.characters = label;
  urlText.fontSize = 10;
  urlText.fills = [{ type: "SOLID", color: { r: 0.65, g: 0.65, b: 0.65 } }];
  info.appendChild(urlText);

  for (const child of card.children) {
    lockAll(child);
  }

  figma.currentPage.appendChild(card);
  const center = figma.viewport.center;
  card.x = Math.round(center.x - card.width / 2);
  card.y = Math.round(center.y - card.height / 2);
  figma.currentPage.selection = [card];
  figma.viewport.scrollAndZoomIntoView([card]);
}

// ── Card creation (finds + deletes placeholder by marker) ──────

async function createCard(msg: CardMsg): Promise<string> {
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  const { url, label, title } = msg;

  // Find placeholder by marker — no ID round-trip needed
  let posX = 0;
  let posY = 0;
  let hadPlaceholder = false;

  const pending = figma.currentPage.findOne(
    n => n.getPluginData("moodboard-pending") === url
  );
  if (pending && "x" in pending) {
    posX = (pending as SceneNode).x;
    posY = (pending as SceneNode).y;
    pending.remove();
    hadPlaceholder = true;
  }

  // ── Main card ──
  const card = figma.createFrame();
  card.name = `[Moodboard] ${label}`;
  card.resize(CARD_MAX_W, 90);
  card.fills = [{ type: "SOLID", color: { r: 0.98, g: 0.98, b: 0.98 } }];
  card.strokes = [{ type: "SOLID", color: { r: 0.98, g: 0.98, b: 0.98 } }];
  card.strokeWeight = 1;
  card.cornerRadius = 10;
  card.clipsContent = true;
  card.layoutMode = "HORIZONTAL";
  card.primaryAxisSizingMode = "FIXED";
  card.counterAxisSizingMode = "AUTO";
  card.itemSpacing = 0;

  card.setPluginData("moodboard-url", url);
  card.setPluginData("moodboard-label", label);

  // Thumbnail (gray placeholder, updated later via set-thumbnail)
  const thumb = figma.createFrame();
  thumb.name = "thumbnail";
  thumb.resize(THUMB_W, THUMB_H);
  thumb.clipsContent = true;
  thumb.fills = [{ type: "SOLID", color: { r: 0.88, g: 0.88, b: 0.88 } }];
  card.appendChild(thumb);
  thumb.layoutSizingHorizontal = "FIXED";
  thumb.layoutSizingVertical = "FILL";

  // Info section
  const info = figma.createFrame();
  info.name = "info";
  info.fills = [];
  info.layoutMode = "VERTICAL";
  info.primaryAxisSizingMode = "AUTO";
  info.counterAxisSizingMode = "AUTO";
  info.paddingTop = 14;
  info.paddingBottom = 14;
  info.paddingLeft = 16;
  info.paddingRight = 20;
  info.itemSpacing = 6;
  card.appendChild(info);
  info.layoutSizingHorizontal = "FILL";

  // Title
  const titleText = figma.createText();
  titleText.name = "title";
  titleText.fontName = { family: "Inter", style: "Medium" };
  titleText.characters = title;
  titleText.fontSize = 14;
  titleText.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
  info.appendChild(titleText);
  titleText.layoutSizingHorizontal = "FILL";
  titleText.textAutoResize = "HEIGHT";
  try {
    titleText.textTruncation = "ENDING";
    titleText.maxLines = 1;
  } catch (_e) {
    // Older API without truncation
  }

  // URL row
  const urlRow = figma.createFrame();
  urlRow.name = "url-row";
  urlRow.fills = [];
  urlRow.layoutMode = "HORIZONTAL";
  urlRow.primaryAxisSizingMode = "AUTO";
  urlRow.counterAxisSizingMode = "AUTO";
  urlRow.counterAxisAlignItems = "CENTER";
  urlRow.itemSpacing = 6;
  info.appendChild(urlRow);

  // Emoji fallback for favicon (replaced later by set-favicon if available)
  const linkEmoji = figma.createText();
  linkEmoji.name = "favicon-placeholder";
  linkEmoji.fontName = { family: "Inter", style: "Regular" };
  linkEmoji.characters = "\uD83D\uDD17";
  linkEmoji.fontSize = 11;
  urlRow.appendChild(linkEmoji);

  const urlText = figma.createText();
  urlText.name = "hostname";
  urlText.fontName = { family: "Inter", style: "Regular" };
  urlText.characters = label;
  urlText.fontSize = 11;
  urlText.fills = [{ type: "SOLID", color: { r: 0.447, g: 0.447, b: 0.447 } }];
  urlRow.appendChild(urlText);

  // Hint
  const hint = figma.createText();
  hint.name = "hint";
  hint.fontName = { family: "Inter", style: "Regular" };
  hint.characters = "Click this frame while Live Moodboard is running";
  hint.fontSize = 10;
  hint.fills = [{ type: "SOLID", color: { r: 0.447, g: 0.447, b: 0.447 } }];
  info.appendChild(hint);

  // Lock children
  for (const child of card.children) {
    lockAll(child);
  }

  // Position at placeholder location or viewport center
  figma.currentPage.appendChild(card);
  if (hadPlaceholder) {
    card.x = posX;
    card.y = posY;
  } else {
    const center = figma.viewport.center;
    card.x = Math.round(center.x - card.width / 2);
    card.y = Math.round(center.y - card.height / 2);
  }
  figma.currentPage.selection = [card];
  figma.viewport.scrollAndZoomIntoView([card]);

  figma.ui.postMessage({ type: "load-url", url, label });

  return card.id;
}

// ── Image updates (separate messages) ──────────────────────────

async function setThumbnail(cardId: string, imageBytes: number[]) {
  const node = await figma.getNodeByIdAsync(cardId);
  if (!node || node.type !== "FRAME") return;

  const thumb = (node as FrameNode).findChild(n => n.name === "thumbnail") as FrameNode | null;
  if (!thumb) return;

  try {
    const img = figma.createImage(new Uint8Array(imageBytes));
    thumb.fills = [{ type: "IMAGE", imageHash: img.hash, scaleMode: "FILL" }];
  } catch (_e) {
    // keep gray placeholder
  }
}

async function setFavicon(cardId: string, imageBytes: number[]) {
  const node = await figma.getNodeByIdAsync(cardId);
  if (!node || node.type !== "FRAME") return;

  const info = (node as FrameNode).findChild(n => n.name === "info") as FrameNode | null;
  if (!info) return;
  const urlRow = info.findChild(n => n.name === "url-row") as FrameNode | null;
  if (!urlRow) return;

  try {
    const favImg = figma.createImage(new Uint8Array(imageBytes));
    const favIcon = figma.createRectangle();
    favIcon.name = "favicon";
    favIcon.resize(14, 14);
    favIcon.cornerRadius = 2;
    favIcon.fills = [{ type: "IMAGE", imageHash: favImg.hash, scaleMode: "FILL" }];
    favIcon.locked = true;

    const emoji = urlRow.findChild(n => n.name === "favicon-placeholder");
    if (emoji) emoji.remove();
    urlRow.insertChild(0, favIcon);
  } catch (_e) {
    // keep emoji fallback
  }
}

// ── Selection change ───────────────────────────────────────────

function handleSelectionChange() {
  const sel = figma.currentPage.selection;
  if (sel.length === 1) {
    const node = sel[0];
    const url = node.getPluginData("moodboard-url");
    if (url) {
      const label = node.getPluginData("moodboard-label") || "";
      figma.ui.postMessage({ type: "load-url", url, label });
      return;
    }
  }
  figma.ui.postMessage({ type: "no-selection" });
}

figma.on("selectionchange", () => handleSelectionChange());

// ── Messages from UI ──────────────────────────────────────────

figma.ui.onmessage = async (msg: PluginMsg) => {
  if (msg.type === "create-placeholder") {
    const m = msg as PlaceholderMsg;
    await createPlaceholder(m.url, m.label);
  }
  if (msg.type === "create-card") {
    const cardId = await createCard(msg as CardMsg);
    figma.ui.postMessage({ type: "card-created", cardId });
  }
  if (msg.type === "set-thumbnail") {
    const m = msg as SetImageMsg;
    await setThumbnail(m.cardId, m.imageBytes);
  }
  if (msg.type === "set-favicon") {
    const m = msg as SetImageMsg;
    await setFavicon(m.cardId, m.imageBytes);
  }
  if (msg.type === "resize-panel") {
    const r = msg as ResizeMsg;
    figma.ui.resize(r.width, r.height);
  }
  if (msg.type === "ui-ready") {
    handleSelectionChange();
  }
};
