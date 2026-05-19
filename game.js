/* ========================================================================
   防癌人生分支簿 — 引擎
   状态机 + 渲染 + 结局判定 + 二维码
   ======================================================================== */

const TAG_LABELS = {
  risk:    "风险预警",
  healthy: "理性主线",
  anxious: "焦虑敏感",
  tech:    "主动行动"
};

const LETTERS = ["A", "B", "C", "D"];

const state = {
  screen: "cover",
  route: null,
  qIndex: 0,
  tally: { risk: 0, healthy: 0, anxious: 0, tech: 0 },
  history: [],
  pickedTag: null
};

const $page = document.getElementById("page");
const $topbar = document.getElementById("topbar");
const $topbarRoute = document.getElementById("topbar-route");
const $topbarStep = document.getElementById("topbar-step");
const $progressFill = document.getElementById("progress-fill");
const $restartBtn = document.getElementById("restart-btn");

$restartBtn.addEventListener("click", () => {
  if (confirm("确认重新开始?当前进度将清空。")) reset();
});

/* ======== 工具 ======== */

function el(tag, opts = {}, ...children) {
  const node = document.createElement(tag);
  if (opts.class) node.className = opts.class;
  if (opts.id) node.id = opts.id;
  if (opts.html) node.innerHTML = opts.html;
  if (opts.text != null) node.textContent = opts.text;
  if (opts.onclick) node.addEventListener("click", opts.onclick);
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

function scrollToTopSmooth() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollIntoSoft(node) {
  if (!node) return;
  const rect = node.getBoundingClientRect();
  const absoluteTop = window.scrollY + rect.top - 80;
  window.scrollTo({ top: absoluteTop, behavior: "smooth" });
}

/* ======== 顶部进度 ======== */

function updateTopbar() {
  if (state.screen === "question" || state.screen === "routeIntro") {
    $topbar.hidden = false;
    const route = GAME_DATA.routes[state.route];
    $topbarRoute.textContent = route.title;
    const total = route.questions.length;
    const step = state.screen === "routeIntro" ? 0 : state.qIndex + 1;
    $topbarStep.textContent = `${step.toString().padStart(2, "0")} / ${total.toString().padStart(2, "0")}`;
    const pct = (step / total) * 100;
    $progressFill.style.width = `${pct}%`;
  } else {
    $topbar.hidden = true;
  }
}

/* ======== 渲染:封面 ======== */

function renderCover() {
  clear($page);
  const screen = el("div", { class: "screen cover" });

  screen.appendChild(el("div", { class: "cover-eyebrow", text: "INTERACTIVE FICTION · 防癌科普" }));
  screen.appendChild(el("h1", { class: "cover-title", text: GAME_DATA.title }));
  screen.appendChild(el("div", { class: "cover-subtitle", text: GAME_DATA.subtitle }));
  screen.appendChild(el("div", { class: "cover-divider" }));

  const blurb = el("div", { class: "cover-blurb" });
  blurb.appendChild(el("p", { text: "三分之一的肿瘤可以预防, 三分之一可早筛治愈, 三分之一可通过规范治疗延长生存。" }));
  blurb.appendChild(el("p", { text: "这是一个由你的选择决定走向的故事——从一周的衣食住行, 到三餐饮食、体检筛查、运动作息, 你会在四条主线里发现自己的健康人格。" }));
  screen.appendChild(blurb);

  screen.appendChild(el("button", {
    class: "btn-primary",
    onclick: () => { state.screen = "prologue"; render(); },
    html: "开始 <span style='margin-left:4px'>→</span>"
  }));

  screen.appendChild(el("div", { class: "cover-meta", text: "「医声有AI」防癌科普游戏" }));

  $page.appendChild(screen);
}

/* ======== 渲染:序章 ======== */

function renderPrologue() {
  clear($page);
  const data = GAME_DATA.prologue;
  const screen = el("div", { class: "screen" });

  screen.appendChild(el("div", { class: "chapter-label", text: data.chapter }));
  screen.appendChild(el("h2", { class: "chapter-title", text: data.title }));

  const scene = el("div", { class: "scene" });
  data.scene.forEach(p => scene.appendChild(el("p", { text: p })));
  screen.appendChild(scene);

  screen.appendChild(el("div", { class: "prompt", text: data.prompt }));

  const picker = el("div", { class: "route-picker" });
  data.choices.forEach((c, i) => {
    const card = el("button", {
      class: "route-card",
      onclick: () => pickRoute(c.next)
    });
    const top = el("div");
    top.appendChild(el("span", { class: "route-card-letter", text: LETTERS[i] }));
    top.appendChild(el("span", { class: "route-card-title", text: c.label }));
    card.appendChild(top);
    card.appendChild(el("div", { class: "route-card-hint", text: c.hint }));
    picker.appendChild(card);
  });
  screen.appendChild(picker);

  $page.appendChild(screen);
}

function pickRoute(routeId) {
  state.route = routeId;
  state.qIndex = 0;
  state.tally = { risk: 0, healthy: 0, anxious: 0, tech: 0 };
  state.history = [];
  state.pickedTag = null;
  state.screen = "routeIntro";
  render();
}

/* ======== 渲染:路线引入 ======== */

function renderRouteIntro() {
  clear($page);
  const route = GAME_DATA.routes[state.route];
  const screen = el("div", { class: "screen route-intro" });

  screen.appendChild(el("div", { class: "chapter-label", text: route.id.replace("route", "Route 0") }));
  screen.appendChild(el("h2", { class: "chapter-title", text: route.title }));
  screen.appendChild(el("div", { class: "chapter-subtitle", text: route.subtitle }));

  screen.appendChild(el("button", {
    class: "btn-primary",
    onclick: () => { state.screen = "question"; state.qIndex = 0; render(); },
    html: "进入第 1 题 <span style='margin-left:4px'>→</span>"
  }));

  $page.appendChild(screen);
}

/* ======== 渲染:题目 ======== */

function renderQuestion() {
  clear($page);
  const route = GAME_DATA.routes[state.route];
  const q = route.questions[state.qIndex];
  const isLast = state.qIndex === route.questions.length - 1;

  const screen = el("div", { class: "screen", id: "q-screen" });

  screen.appendChild(el("div", { class: "chapter-label", text: q.chapter }));
  screen.appendChild(el("h2", { class: "chapter-title", text: q.title }));

  const scene = el("div", { class: "scene" });
  q.scene.forEach(p => scene.appendChild(el("p", { text: p })));
  screen.appendChild(scene);

  screen.appendChild(el("div", { class: "prompt", text: "你的选择" }));

  const choices = el("div", { class: "choices" });
  q.choices.forEach((c, i) => {
    const btn = el("button", {
      class: "choice",
      onclick: () => pickChoice(i)
    });
    btn.appendChild(el("span", { class: "choice-letter", text: LETTERS[i] }));
    btn.appendChild(document.createTextNode(c.label));
    choices.appendChild(btn);
  });
  screen.appendChild(choices);

  // 反馈 + 继续 容器(初始空)
  const fbHolder = el("div", { id: "fb-holder" });
  screen.appendChild(fbHolder);

  $page.appendChild(screen);
  state.pickedTag = null;
}

function pickChoice(choiceIndex) {
  if (state.pickedTag != null) return;
  const route = GAME_DATA.routes[state.route];
  const q = route.questions[state.qIndex];
  const choice = q.choices[choiceIndex];

  state.tally[choice.tag]++;
  state.history.push({ route: state.route, qIndex: state.qIndex, choiceIndex, tag: choice.tag });
  state.pickedTag = choice.tag;

  // UI: lock other choices, mark selected
  const btns = document.querySelectorAll(".choice");
  btns.forEach((b, i) => {
    if (i === choiceIndex) b.classList.add("selected");
    else b.classList.add("locked");
    b.disabled = true;
  });

  // 渲染反馈
  const fbHolder = document.getElementById("fb-holder");
  clear(fbHolder);

  const fb = el("div", { class: `feedback t-${choice.tag}` });
  fb.appendChild(el("div", { class: "feedback-tag", text: TAG_LABELS[choice.tag] }));
  fb.appendChild(el("div", { class: "feedback-body", text: choice.feedback }));
  fbHolder.appendChild(fb);

  // 继续按钮
  const isLast = state.qIndex === GAME_DATA.routes[state.route].questions.length - 1;
  const nextBar = el("div", { class: "next-bar" });
  nextBar.appendChild(el("button", {
    class: "btn-next",
    onclick: () => goNext(),
    html: `${isLast ? "查看结局" : "继续"} <span class="arrow">→</span>`
  }));
  fbHolder.appendChild(nextBar);

  setTimeout(() => scrollIntoSoft(fb), 80);
}

function goNext() {
  const route = GAME_DATA.routes[state.route];
  if (state.qIndex < route.questions.length - 1) {
    state.qIndex++;
    state.pickedTag = null;
    render();
  } else {
    state.screen = "ending";
    render();
  }
}

/* ======== 结局判定 ======== */

function decideEnding(tally) {
  if (tally.tech >= 4) return "tech";
  if (tally.anxious >= 3) return "anxious";
  if (tally.healthy >= 5) return "healthy";
  if (tally.risk >= 4) return "buddha";
  // 兜底:取最高项;并列时按优先级 tech > anxious > healthy > buddha
  const order = ["tech", "anxious", "healthy", "buddha"];
  const tallyMap = { tech: tally.tech, anxious: tally.anxious, healthy: tally.healthy, buddha: tally.risk };
  let best = order[0];
  for (const k of order) {
    if (tallyMap[k] > tallyMap[best]) best = k;
  }
  return best;
}

/* ======== 渲染:结局 ======== */

function renderEnding() {
  clear($page);
  const endingKey = decideEnding(state.tally);
  const ending = GAME_DATA.endings[endingKey];
  const route = GAME_DATA.routes[state.route];

  const screen = el("div", { class: "screen ending" });

  screen.appendChild(el("div", { class: "ending-eyebrow", text: `${route.title} · 结局` }));
  screen.appendChild(el("h2", { class: "ending-title", text: ending.title }));

  const tags = el("div", { class: "ending-tags" });
  ending.tags.forEach(t => tags.appendChild(el("span", { class: "ending-tag", text: t })));
  screen.appendChild(tags);

  screen.appendChild(el("div", { class: "ending-section-title", text: "AI 科普 · 一句话" }));
  screen.appendChild(el("div", { class: "ending-summary", text: ending.summary }));

  screen.appendChild(el("div", { class: "ending-section-title", text: "你的特质" }));
  const traits = el("ul", { class: "ending-traits" });
  ending.traits.forEach(t => traits.appendChild(el("li", { text: t })));
  screen.appendChild(traits);

  screen.appendChild(el("div", { class: "ending-section-title", text: "给你的一句建议" }));
  screen.appendChild(el("div", { class: "ending-advice", text: ending.advice }));

  // 选项分布
  screen.appendChild(el("div", { class: "ending-section-title", text: "你的选项分布" }));
  const dist = el("div", { class: "scene" });
  const total = Object.values(state.tally).reduce((a, b) => a + b, 0);
  const distLine = el("p", {
    text:
      `理性主线 ${state.tally.healthy} · ` +
      `主动行动 ${state.tally.tech} · ` +
      `焦虑敏感 ${state.tally.anxious} · ` +
      `风险预警 ${state.tally.risk}  ( 共 ${total} 题 )`
  });
  distLine.style.fontFamily = "var(--font-num)";
  distLine.style.fontSize = "13px";
  distLine.style.letterSpacing = "0.04em";
  distLine.style.color = "var(--ink-mute)";
  dist.appendChild(distLine);
  screen.appendChild(dist);

  // 分享卡(二维码)
  const shareCard = el("div", { class: "share-card" });
  const shareText = el("div", { class: "share-card-text" });
  shareText.appendChild(el("div", { class: "share-card-title", text: "扫码邀请朋友测一测" }));
  shareText.appendChild(el("div", {
    class: "share-card-desc",
    text: "把你的健康人格分享出去, 让更多人在故事里建立防癌认知。"
  }));
  shareText.appendChild(el("div", {
    class: "share-card-id",
    text: `ID · ${endingKey.toUpperCase()}-${(new Date()).toISOString().slice(0,10).replace(/-/g,"")}`
  }));
  shareCard.appendChild(shareText);

  const qrBox = el("div", { class: "qr-box", id: "qr-box" });
  shareCard.appendChild(qrBox);
  screen.appendChild(shareCard);

  // 操作区
  const actions = el("div", { class: "ending-actions" });
  actions.appendChild(el("button", {
    class: "btn-primary",
    onclick: () => { state.screen = "prologue"; render(); },
    html: "试试其他主线 <span style='margin-left:4px'>→</span>"
  }));
  actions.appendChild(el("button", {
    class: "btn-ghost",
    onclick: () => reset(),
    text: "从头开始"
  }));
  screen.appendChild(actions);

  // 页脚
  screen.appendChild(el("div", {
    class: "page-footer",
    text: "「医声有AI」防癌科普游戏 · 本作的医学知识与防癌规范均引自 ClinicalKey AI 平台"
  }));

  $page.appendChild(screen);
  renderQR();
}

/* ======== 二维码 ======== */

function renderQR() {
  const box = document.getElementById("qr-box");
  if (!box) return;
  try {
    const qr = qrcode(0, "M");
    qr.addData(GAME_DATA.shareUrl);
    qr.make();
    const dataUrl = qr.createDataURL(6, 0);
    const img = document.createElement("img");
    img.src = dataUrl;
    img.alt = "扫码分享";
    box.appendChild(img);
  } catch (err) {
    box.textContent = "二维码生成失败";
    console.error(err);
  }
}

/* ======== 主循环 ======== */

function render() {
  switch (state.screen) {
    case "cover":      renderCover(); break;
    case "prologue":   renderPrologue(); break;
    case "routeIntro": renderRouteIntro(); break;
    case "question":   renderQuestion(); break;
    case "ending":     renderEnding(); break;
  }
  updateTopbar();
  if (state.screen !== "question" || state.qIndex === 0) {
    scrollToTopSmooth();
  } else {
    window.scrollTo({ top: 0, behavior: "auto" });
  }
}

function reset() {
  state.screen = "cover";
  state.route = null;
  state.qIndex = 0;
  state.tally = { risk: 0, healthy: 0, anxious: 0, tech: 0 };
  state.history = [];
  state.pickedTag = null;
  render();
}

/* ======== 启动 ======== */

document.addEventListener("DOMContentLoaded", () => {
  render();
});
