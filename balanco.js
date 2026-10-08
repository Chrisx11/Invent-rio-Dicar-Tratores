const SUPABASE_URL = "https://ztiymllmnylupgyjiqcz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0aXltbGxtbnlsdXBneWppcWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MzkxMTgsImV4cCI6MjEwNzAxNTExOH0.lbm8DvUtEQDOwEXW4biEqVJkpxhBbcpW2a_du3KljmU";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const COLORS = {
  Lubrificantes: "#e8b84a",
  Filtros: "#6ea8ff",
  Freios: "#ff4d4d",
  Motor: "#ff5a1f",
  Suspensão: "#3ecf8e",
  Elétrica: "#c084fc",
  Transmissão: "#67e8f9",
  Acessórios: "#9a9488",
};
const PALETTE = Object.values(COLORS);

const $ = (id) => document.getElementById(id);
const money = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const totalOf = (it) => Number(it.qty || 0) * Number(it.unitValue || 0);

function colorFor(name) {
  if (!name) return "#9a9488";
  if (COLORS[name]) return COLORS[name];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function fromRow(row) {
  return {
    category: row.category || "",
    subcategory: row.subcategory || "",
    qty: row.qty == null ? 0 : Number(row.qty),
    unitValue: row.unit_value == null ? 0 : Number(row.unit_value),
  };
}

function groupBy(list, key) {
  const map = new Map();
  for (const it of list) {
    const name = it[key] || "Sem classificação";
    const prev = map.get(name) || { name, value: 0, count: 0 };
    prev.value += totalOf(it);
    prev.count += 1;
    map.set(name, prev);
  }
  return [...map.values()].sort((a, b) => b.value - a.value);
}

let items = [];
let activeCategory = null;

function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (el.hidden = true), 2200);
}

function currentRows() {
  if (!activeCategory) return groupBy(items, "category");
  return groupBy(
    items.filter((i) => (i.category || "Sem classificação") === activeCategory),
    "subcategory"
  );
}

function renderKpis() {
  const total = items.reduce((s, i) => s + totalOf(i), 0);
  $("kpiTotalValue").textContent = money(total);
  $("kpiCatCount").textContent = groupBy(items, "category").length;
  $("kpiItemCount").textContent = items.length;
}

function renderChart() {
  const rows = currentRows();
  const total = rows.reduce((s, r) => s + r.value, 0);
  const max = Math.max(...rows.map((r) => r.value), 1);
  const drill = Boolean(activeCategory);

  $("chartTitle").textContent = drill
    ? `${activeCategory} · subcategorias`
    : "Valor por categoria";
  $("chartHint").textContent = drill
    ? "Valores das subcategorias nesta linha. Use o botão ao lado para voltar."
    : "Clique numa barra para ver o detalhe por subcategoria.";
  $("btnChartBack").hidden = !drill;

  if (!rows.length) {
    $("chart").innerHTML = `<div class="empty"><p>Nenhum valor em estoque para montar o gráfico.</p></div>`;
    return;
  }

  $("chart").innerHTML = rows
    .map((row) => {
      const pct = total ? (row.value / total) * 100 : 0;
      const width = (row.value / max) * 100;
      const color = colorFor(drill ? activeCategory : row.name);
      return `<button type="button" class="bar-row" data-name="${escapeHtml(row.name)}" ${drill ? "disabled" : ""}>
        <span class="bar-label">${escapeHtml(row.name)}</span>
        <span class="bar-track"><i style="width:${width}%;background:${color}"></i></span>
        <span class="bar-meta">
          <b>${money(row.value)}</b>
          <small>${pct.toFixed(1)}% · ${row.count} ${row.count === 1 ? "item" : "itens"}</small>
        </span>
      </button>`;
    })
    .join("");
}

$("chart").onclick = (e) => {
  const btn = e.target.closest(".bar-row");
  if (!btn || activeCategory) return;
  activeCategory = btn.dataset.name;
  renderChart();
};

$("btnChartBack").onclick = () => {
  activeCategory = null;
  renderChart();
};

async function init() {
  const { data, error } = await db.from("inventory_items").select("*");
  if (error) {
    console.error(error);
    toast("Não foi possível carregar o balanço");
    $("chart").innerHTML = `<div class="empty"><p>Não foi possível carregar os dados do Supabase.</p></div>`;
    return;
  }
  items = (data || []).map(fromRow);
  renderKpis();
  renderChart();
}

init();
