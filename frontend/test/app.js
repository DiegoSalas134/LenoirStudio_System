const API = "/api/v1";
const $ = (id) => document.getElementById(id);
let catalog = null;
let decorations = [];

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? `Error ${res.status}`);
  return data;
}

const money = (n) => `$${n}`;

function fillSelect(select, items, label) {
  select.replaceChildren();
  for (const item of items) {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = label(item);
    select.append(option);
  }
}

function currentTechnique() {
  return catalog.techniques.find((t) => t.id === Number($("technique").value));
}

function updateLengthOptions() {
  const max = currentTechnique().maxLength;
  for (const option of $("length").options) option.disabled = Number(option.value) > max;
  if (Number($("length").value) > max) $("length").value = String(max);
  $("tonesInfo").textContent = `Esta técnica incluye ${currentTechnique().includedTones} tonos. Cada tono extra cuesta ${money(catalog.extraTonePrice)}.`;
}

function renderDecorations() {
  const list = $("decorationList");
  list.replaceChildren();
  for (const dec of decorations) {
    const item = catalog.decorations.find((d) => d.id === dec.id);
    const li = document.createElement("li");
    li.textContent = `${item.name} x ${dec.quantity} (${item.unit === "NAIL" ? "uñas" : "piezas"}) `;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Quitar";
    remove.addEventListener("click", () => {
      decorations = decorations.filter((d) => d.id !== dec.id);
      renderDecorations();
      recalculate();
    });
    li.append(remove);
    list.append(li);
  }
}

function payload() {
  const removalId = Number($("removal").value);
  return {
    techniqueId: Number($("technique").value),
    length: Number($("length").value),
    extraTones: Number($("extraTones").value),
    decorations,
    removal: removalId ? { id: removalId, nailCount: Number($("removalNails").value) } : null,
  };
}

function summaryRow(table, label, amount, bold = false) {
  const tr = table.insertRow();
  tr.insertCell().textContent = label;
  tr.insertCell().textContent = money(amount);
  if (bold) tr.style.fontWeight = "bold";
}

async function recalculate() {
  $("quoteError").textContent = "";
  $("saveResult").textContent = "";
  const table = $("summary");
  try {
    const q = await api("/quotes/calculate", { method: "POST", body: JSON.stringify(payload()) });
    table.replaceChildren();
    summaryRow(table, q.technique.name, q.technique.price);
    summaryRow(table, `Largo ${q.length.value}`, q.length.charge);
    summaryRow(table, `Tonos extra (${q.extraTones.count})`, q.extraTones.charge);
    for (const d of q.decorations) summaryRow(table, `${d.name} x ${d.quantity}`, d.subtotal);
    if (q.removal) summaryRow(table, `${q.removal.name} x ${q.removal.nailCount}`, q.removal.subtotal);
    summaryRow(table, "TOTAL ESTIMADO", q.estimatedTotal, true);
  } catch (error) {
    table.replaceChildren();
    $("quoteError").textContent = error.message;
  }
}

async function saveQuote() {
  $("saveResult").textContent = "";
  try {
    const saved = await api("/quotes", { method: "POST", body: JSON.stringify(payload()) });
    $("saveResult").textContent = `Cotización guardada. Código: ${saved.code} - Total: ${money(saved.estimatedTotal)}`;
  } catch (error) {
    $("quoteError").textContent = error.message;
  }
}

async function login(event) {
  event.preventDefault();
  try {
    await api("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: $("username").value, password: $("password").value }),
    });
    $("password").value = "";
    $("adminMessage").textContent = "Sesión iniciada";
  } catch (error) {
    $("adminMessage").textContent = error.message;
  }
}

async function logout() {
  try {
    await api("/admin/auth/logout", { method: "POST" });
    $("adminMessage").textContent = "Sesión cerrada";
    $("quoteTable").replaceChildren();
  } catch (error) {
    $("adminMessage").textContent = error.message;
  }
}

async function listQuotes() {
  const table = $("quoteTable");
  table.replaceChildren();
  try {
    const quotes = await api("/admin/quotes");
    $("adminMessage").textContent = `${quotes.length} cotizaciones guardadas`;
    for (const q of quotes) {
      const tr = table.insertRow();
      tr.insertCell().textContent = new Date(q.createdAt).toLocaleString();
      tr.insertCell().textContent = q.details?.technique?.name ?? "-";
      tr.insertCell().textContent = q.code.slice(0, 8);
      tr.insertCell().textContent = money(q.estimatedTotal);
    }
  } catch (error) {
    $("adminMessage").textContent = `${error.message} (inicia sesión primero)`;
  }
}

function init() {
  fillSelect($("technique"), catalog.techniques.map((t) => ({ value: t.id, ...t })), (t) => `${t.name} - ${money(t.price)}`);
  fillSelect($("length"), Array.from({ length: 9 }, (_, i) => ({ value: i + 1 })), (l) => `Largo ${l.value}`);
  fillSelect($("decorationSelect"), catalog.decorations.map((d) => ({ value: d.id, ...d })),
    (d) => `${d.name} - ${money(d.price)} por ${d.unit === "NAIL" ? "uña" : "pieza"}`);
  fillSelect($("removal"), [{ value: 0, name: "Sin retiro", price: 0 }, ...catalog.removals.map((r) => ({ value: r.id, ...r }))],
    (r) => (r.value === 0 ? "Sin retiro" : `${r.name} - ${money(r.price)} por uña`));

  for (const id of ["technique", "length", "extraTones", "removal", "removalNails"]) {
    $(id).addEventListener("change", () => {
      if (id === "technique") updateLengthOptions();
      recalculate();
    });
  }
  $("addDecoration").addEventListener("click", () => {
    const id = Number($("decorationSelect").value);
    const quantity = Number($("decorationQty").value);
    decorations = decorations.filter((d) => d.id !== id);
    decorations.push({ id, quantity });
    renderDecorations();
    recalculate();
  });
  $("saveQuote").addEventListener("click", saveQuote);
  $("loginForm").addEventListener("submit", login);
  $("logout").addEventListener("click", logout);
  $("listQuotes").addEventListener("click", listQuotes);

  updateLengthOptions();
  recalculate();
}

api("/catalog").then((data) => {
  catalog = data;
  init();
}).catch((error) => {
  $("quoteError").textContent = `No se pudo cargar el catálogo: ${error.message}`;
});