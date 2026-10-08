const SUPABASE_URL = "https://ztiymllmnylupgyjiqcz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0aXltbGxtbnlsdXBneWppcWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MzkxMTgsImV4cCI6MjEwNzAxNTExOH0.lbm8DvUtEQDOwEXW4biEqVJkpxhBbcpW2a_du3KljmU";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const LOCAL_KEY = "ferro-pista-inventario-v2";
const LOCAL_CAT_KEY = "ferro-pista-categorias";
const NEW_CAT = "__new__";

const SCHEMA_SQL = `create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  item_number text default '',
  category text default '',
  subcategory text default '',
  description text default '',
  brand text default '',
  model text default '',
  part_number text default '',
  asset_number text default '',
  serial_number text default '',
  application text default '',
  unit text default '',
  qty numeric,
  condition text default '',
  location text default '',
  responsible text default '',
  unit_value numeric,
  min_stock numeric,
  max_stock numeric,
  lot text default '',
  expiry date,
  status text default '',
  count_date date,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inventory_categories (
  name text primary key,
  created_at timestamptz default now()
);

alter table public.inventory_items enable row level security;
alter table public.inventory_categories enable row level security;

drop policy if exists "anon_all_inventory_items" on public.inventory_items;
create policy "anon_all_inventory_items"
  on public.inventory_items for all
  to anon, authenticated
  using (true) with check (true);

drop policy if exists "anon_all_inventory_categories" on public.inventory_categories;
create policy "anon_all_inventory_categories"
  on public.inventory_categories for all
  to anon, authenticated
  using (true) with check (true);

grant select, insert, update, delete on public.inventory_items to anon, authenticated;
grant select, insert, update, delete on public.inventory_categories to anon, authenticated;`;

const CATEGORIES = {
  Lubrificantes: ["Óleo de motor", "Óleo de câmbio", "Fluido", "Graxa"],
  Filtros: ["Filtro de óleo", "Filtro de ar", "Filtro de combustível", "Filtro de cabine"],
  Freios: ["Pastilha", "Disco", "Fluido de freio", "Tambor"],
  Motor: ["Ignição", "Correia", "Junta", "Sensor"],
  Suspensão: ["Amortecedor", "Mola", "Bucha", "Terminal"],
  Elétrica: ["Bateria", "Alternador", "Iluminação", "Fiação"],
  Transmissão: ["Embreagem", "Homocinética", "Cubo", "Relação"],
  Acessórios: ["Ferramenta", "Consumível", "Outros"],
};

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

function colorFor(cat) {
  if (!cat) return "#9a9488";
  if (COLORS[cat]) return COLORS[cat];
  let h = 0;
  for (const ch of cat) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

const VIEW_FIELDS = [
  ["itemNumber", "Nº item"],
  ["category", "Categoria"],
  ["subcategory", "Subcategoria"],
  ["description", "Descrição do item"],
  ["brand", "Marca"],
  ["model", "Modelo"],
  ["partNumber", "Código / Part Number"],
  ["assetNumber", "Nº patrimônio"],
  ["serialNumber", "Nº série"],
  ["application", "Aplicação"],
  ["unit", "Unidade"],
  ["qty", "Quantidade"],
  ["condition", "Estado de conservação"],
  ["location", "Localização"],
  ["responsible", "Responsável"],
  ["unitValue", "Valor unitário (R$)"],
  ["totalValue", "Valor total (R$)"],
  ["minStock", "Estoque mínimo"],
  ["maxStock", "Estoque máximo"],
  ["lot", "Lote"],
  ["expiry", "Validade"],
  ["status", "Situação"],
  ["countDate", "Data da contagem"],
  ["notes", "Observação"],
];

const seed = [
  {
    id: "1", itemNumber: "0001", category: "Lubrificantes", subcategory: "Óleo de motor",
    description: "Óleo sintético 5W30 1L", brand: "Ipiranga", model: "5W30 SN",
    partNumber: "OLE-5W30-01", assetNumber: "PAT-1101", serialNumber: "—",
    application: "Motores flex 1.0 a 1.6", unit: "L", qty: 42, condition: "Novo",
    location: "A-12", responsible: "Carlos Mendes", unitValue: 48.9, minStock: 12,
    maxStock: 80, lot: "L2026-02", expiry: "2028-03-15", status: "Ativo",
    countDate: "2026-10-02", notes: "Estoque de giro rápido.",
  },
  {
    id: "2", itemNumber: "0002", category: "Filtros", subcategory: "Filtro de óleo",
    description: "Filtro de óleo universal", brand: "Mann Filter", model: "W 719/5",
    partNumber: "FIL-OLE-22", assetNumber: "PAT-1102", serialNumber: "—",
    application: "Linha VW / Fiat", unit: "UN", qty: 18, condition: "Novo",
    location: "B-03", responsible: "Ana Souza", unitValue: 32.5, minStock: 10,
    maxStock: 40, lot: "L2026-01", expiry: "", status: "Ativo",
    countDate: "2026-10-02", notes: "",
  },
  {
    id: "3", itemNumber: "0003", category: "Freios", subcategory: "Pastilha",
    description: "Pastilha de freio dianteira", brand: "Bosch", model: "BB1234",
    partNumber: "FRE-PAS-09", assetNumber: "PAT-2210", serialNumber: "—",
    application: "Gol / Voyage G5-G7", unit: "JOGO", qty: 6, condition: "Bom",
    location: "C-01", responsible: "Carlos Mendes", unitValue: 189, minStock: 8,
    maxStock: 24, lot: "L2025-11", expiry: "", status: "Ativo",
    countDate: "2026-09-28", notes: "Reposição urgente — abaixo do mínimo.",
  },
  {
    id: "4", itemNumber: "0004", category: "Motor", subcategory: "Ignição",
    description: "Vela de ignição iridium", brand: "NGK", model: "IZFR6K11",
    partNumber: "MOT-VEL-14", assetNumber: "PAT-3304", serialNumber: "—",
    application: "Honda Fit / City", unit: "UN", qty: 24, condition: "Novo",
    location: "A-07", responsible: "Ana Souza", unitValue: 67.8, minStock: 8,
    maxStock: 48, lot: "L2026-03", expiry: "", status: "Ativo",
    countDate: "2026-10-01", notes: "",
  },
  {
    id: "5", itemNumber: "0005", category: "Suspensão", subcategory: "Amortecedor",
    description: "Amortecedor dianteiro", brand: "Monroe", model: "334123",
    partNumber: "SUS-AMO-03", assetNumber: "PAT-4401", serialNumber: "SN-4401-A",
    application: "Onix / Prisma", unit: "UN", qty: 4, condition: "Bom",
    location: "D-02", responsible: "Rafael Lima", unitValue: 420, minStock: 4,
    maxStock: 12, lot: "L2025-08", expiry: "", status: "Reservado",
    countDate: "2026-09-20", notes: "Reservado para OS 1844.",
  },
  {
    id: "6", itemNumber: "0006", category: "Elétrica", subcategory: "Bateria",
    description: "Bateria 60Ah", brand: "Moura", model: "M60GD",
    partNumber: "ELE-BAT-60", assetNumber: "PAT-5506", serialNumber: "MOU-60-9921",
    application: "Veículos leves 12V", unit: "UN", qty: 3, condition: "Novo",
    location: "E-01", responsible: "Rafael Lima", unitValue: 589.9, minStock: 5,
    maxStock: 10, lot: "L2026-04", expiry: "2028-04-01", status: "Ativo",
    countDate: "2026-10-04", notes: "Manter em local seco.",
  },
  {
    id: "7", itemNumber: "0007", category: "Motor", subcategory: "Correia",
    description: "Kit correia dentada", brand: "Gates", model: "K015606",
    partNumber: "MOT-COR-08", assetNumber: "PAT-3308", serialNumber: "—",
    application: "Fire 1.0 / 1.4", unit: "KIT", qty: 9, condition: "Novo",
    location: "A-04", responsible: "Carlos Mendes", unitValue: 310, minStock: 6,
    maxStock: 18, lot: "L2026-01", expiry: "", status: "Ativo",
    countDate: "2026-10-02", notes: "",
  },
  {
    id: "8", itemNumber: "0008", category: "Freios", subcategory: "Fluido de freio",
    description: "Fluido de freio DOT 4", brand: "TRW", model: "DOT 4 500ml",
    partNumber: "FRE-DOT-04", assetNumber: "PAT-2218", serialNumber: "—",
    application: "Sistema hidráulico de freio", unit: "UN", qty: 15, condition: "Novo",
    location: "C-08", responsible: "Ana Souza", unitValue: 28.4, minStock: 6,
    maxStock: 30, lot: "L2026-05", expiry: "2027-11-30", status: "Ativo",
    countDate: "2026-10-06", notes: "",
  },
];

let items = [];
let extraCats = [];
let filter = "Todos";
let editing = null;
let viewingId = null;

const $ = (id) => document.getElementById(id);
const money = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const totalOf = (it) => Number(it.qty || 0) * Number(it.unitValue || 0);

function emptyToNull(value) {
  return value === "" || value == null ? null : value;
}

function toRow(item) {
  return {
    id: item.id,
    item_number: item.itemNumber || "",
    category: item.category || "",
    subcategory: item.subcategory || "",
    description: item.description || "",
    brand: item.brand || "",
    model: item.model || "",
    part_number: item.partNumber || "",
    asset_number: item.assetNumber || "",
    serial_number: item.serialNumber || "",
    application: item.application || "",
    unit: item.unit || "",
    qty: emptyToNull(item.qty),
    condition: item.condition || "",
    location: item.location || "",
    responsible: item.responsible || "",
    unit_value: emptyToNull(item.unitValue),
    min_stock: emptyToNull(item.minStock),
    max_stock: emptyToNull(item.maxStock),
    lot: item.lot || "",
    expiry: emptyToNull(item.expiry),
    status: item.status || "",
    count_date: emptyToNull(item.countDate),
    notes: item.notes || "",
    updated_at: new Date().toISOString(),
  };
}

function fromRow(row) {
  return {
    id: row.id,
    itemNumber: row.item_number || "",
    category: row.category || "",
    subcategory: row.subcategory || "",
    description: row.description || "",
    brand: row.brand || "",
    model: row.model || "",
    partNumber: row.part_number || "",
    assetNumber: row.asset_number || "",
    serialNumber: row.serial_number || "",
    application: row.application || "",
    unit: row.unit || "",
    qty: row.qty == null ? "" : Number(row.qty),
    condition: row.condition || "",
    location: row.location || "",
    responsible: row.responsible || "",
    unitValue: row.unit_value == null ? "" : Number(row.unit_value),
    minStock: row.min_stock == null ? "" : Number(row.min_stock),
    maxStock: row.max_stock == null ? "" : Number(row.max_stock),
    lot: row.lot || "",
    expiry: row.expiry || "",
    status: row.status || "",
    countDate: row.count_date || "",
    notes: row.notes || "",
  };
}

function isMissingTable(error) {
  return error && (error.code === "PGRST205" || /inventory_items|schema cache/i.test(error.message || ""));
}

function showSetup() {
  $("setupSql").textContent = SCHEMA_SQL;
  $("setupOverlay").hidden = false;
}

async function rememberCategory(name) {
  if (!name) return;
  const known = new Set([...Object.keys(CATEGORIES), ...extraCats, ...usedCategories()]);
  if (known.has(name)) return;
  extraCats.push(name);
  const { error } = await db.from("inventory_categories").upsert({ name });
  if (error) console.error(error);
}

async function fetchAll() {
  const [{ data: rows, error: itemsError }, { data: cats, error: catsError }] = await Promise.all([
    db.from("inventory_items").select("*").order("created_at", { ascending: false }),
    db.from("inventory_categories").select("name"),
  ]);
  if (itemsError) throw itemsError;
  if (catsError && !isMissingTable(catsError)) throw catsError;
  extraCats = (cats || []).map((c) => c.name).filter(Boolean);
  items = (rows || []).map(fromRow);
}

async function migrateLocalIfNeeded() {
  if (items.length) return;
  let local = [];
  let localCats = [];
  try {
    local = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    localCats = JSON.parse(localStorage.getItem(LOCAL_CAT_KEY) || "[]");
  } catch {}
  if (!local.length && !localCats.length) return;
  if (local.length) {
    const { error } = await db.from("inventory_items").insert(local.map(toRow));
    if (error) throw error;
  }
  if (localCats.length) {
    await db.from("inventory_categories").upsert(localCats.filter(Boolean).map((name) => ({ name })));
  }
  await fetchAll();
}

async function persistItem(data, isEdit) {
  const { error } = isEdit
    ? await db.from("inventory_items").update(toRow(data)).eq("id", data.id)
    : await db.from("inventory_items").insert(toRow(data));
  if (error) throw error;
}

async function persistDelete(id) {
  const { error } = await db.from("inventory_items").delete().eq("id", id);
  if (error) throw error;
}

function nextItemNumber() {
  const nums = items.map((i) => parseInt(i.itemNumber, 10)).filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return String(next).padStart(4, "0");
}

function statusClass(status) {
  if (!status) return "";
  if (status === "Ativo") return "ok";
  if (status === "Reservado" || status === "Manutenção") return "low";
  if (status === "Em falta" || status === "Baixado") return "crit";
  return "ok";
}

function stockState(item) {
  const qty = Number(item.qty || 0);
  const min = Number(item.minStock || 0);
  if (!item.qty && item.qty !== 0) return { key: "", label: "" };
  if (qty <= 0) return { key: "crit", label: "Sem estoque" };
  if (min && qty < min) return { key: "crit", label: "Crítico" };
  if (min && qty < min * 1.5) return { key: "low", label: "Baixo" };
  return { key: "ok", label: "OK" };
}

function dash(value) {
  return value === 0 || value ? String(value) : "—";
}

function numOrEmpty(value) {
  return value === "" || value == null ? "" : Number(value);
}

function usedCategories() {
  return [...new Set(items.map((i) => i.category).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
}

function allCategoryOptions() {
  return [...new Set([...Object.keys(CATEGORIES), ...usedCategories(), ...extraCats])].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
}

function currentCategory() {
  const pick = $("fieldCategoryPick").value;
  if (pick === NEW_CAT) return $("fieldCategoryNew").value.trim();
  return pick;
}

function toggleNewCategory(show) {
  $("newCatWrap").hidden = !show;
  if (show) $("fieldCategoryNew").focus();
}

function fillCategories(selected, subSelected) {
  const cats = allCategoryOptions();
  const isCustom = selected && !cats.includes(selected);
  $("fieldCategoryPick").innerHTML =
    `<option value="">—</option>` +
    cats.map((c) => `<option value="${escapeHtml(c)}" ${c === selected ? "selected" : ""}>${escapeHtml(c)}</option>`).join("") +
    `<option value="${NEW_CAT}">＋ Criar nova categoria</option>`;
  if (isCustom) {
    $("fieldCategoryPick").value = NEW_CAT;
    $("fieldCategoryNew").value = selected;
    toggleNewCategory(true);
  } else {
    $("fieldCategoryNew").value = "";
    toggleNewCategory(false);
  }
  fillSubcategories(isCustom ? selected : selected || "", subSelected);
}

function fillSubcategories(category, selected) {
  const known = CATEGORIES[category] || [];
  const used = items
    .filter((i) => i.category === category && i.subcategory)
    .map((i) => i.subcategory);
  const list = [...new Set([...known, ...used])].sort((a, b) => a.localeCompare(b, "pt-BR"));
  $("listSubcategory").innerHTML = list
    .map((s) => `<option value="${escapeHtml(s)}"></option>`)
    .join("");
  if (selected != null) $("fieldSubcategory").value = selected;
}

function renderFilters() {
  const cats = usedCategories();
  if (filter !== "Todos" && !cats.includes(filter)) filter = "Todos";
  const track = $("filters");
  const left = track.scrollLeft;
  track.innerHTML = ["Todos", ...cats]
    .map((c) => `<button class="chip ${filter === c ? "active" : ""}" data-cat="${c}">${c}</button>`)
    .join("");
  track.scrollLeft = left;
  updateFilterArrows();
}

function updateFilterArrows() {
  const el = $("filters");
  const max = el.scrollWidth - el.clientWidth;
  $("filterPrev").disabled = el.scrollLeft <= 2;
  $("filterNext").disabled = max <= 2 || el.scrollLeft >= max - 2;
}

function visible() {
  const q = $("search").value.trim().toLowerCase();
  return items.filter((it) => {
    const matchCat = filter === "Todos" || it.category === filter;
    const hay = [it.itemNumber, it.description, it.brand, it.model, it.partNumber, it.location, it.responsible, it.subcategory]
      .join(" ")
      .toLowerCase();
    return matchCat && (!q || hay.includes(q));
  });
}

function renderKpis() {
  $("kpiTotal").textContent = items.length;
  $("kpiLow").textContent = items.filter((i) => i.minStock !== "" && i.minStock != null && Number(i.qty || 0) < Number(i.minStock)).length;
  $("kpiValue").textContent = money(items.reduce((s, i) => s + totalOf(i), 0));
  $("kpiCats").textContent = usedCategories().length;
}

function renderTable() {
  const rows = visible();
  $("rowCount").textContent = `${rows.length} ${rows.length === 1 ? "item" : "itens"}`;
  $("empty").hidden = rows.length > 0;
  $("tbody").innerHTML = rows
    .map((it) => {
      const st = stockState(it);
      const color = colorFor(it.category);
      const stockTag = st.label ? `<span class="tag ${st.key}">${st.label}</span>` : "";
      const statusTag = it.status ? `<span class="tag ${statusClass(it.status)}">${escapeHtml(it.status)}</span>` : "—";
      return `<tr>
        <td class="mono">${escapeHtml(dash(it.itemNumber))}</td>
        <td>
          <div class="prod">
            <b>${escapeHtml(it.description || "Sem descrição")}</b>
            <span>${escapeHtml(dash(it.partNumber))} · ${escapeHtml(dash(it.subcategory))}</span>
          </div>
        </td>
        <td><span class="cat"><i class="dot" style="background:${color}"></i>${escapeHtml(dash(it.category))}</span></td>
        <td>${escapeHtml(dash(it.brand))}</td>
        <td>${qtyStepper(it)}</td>
        <td>${statusTag} ${stockTag}</td>
        <td class="loc">${escapeHtml(dash(it.location))}</td>
        <td class="price">${it.unitValue === "" || it.unitValue == null ? "—" : money(totalOf(it))}</td>
        <td>
          <div class="row-actions">
            <button class="ghost-mini" data-view="${it.id}" title="Visualizar">Ver</button>
            <button class="ghost-mini" data-edit="${it.id}" title="Editar">Editar</button>
            <button class="ghost-mini danger" data-del="${it.id}" title="Remover">✕</button>
          </div>
        </td>
      </tr>`;
    })
    .join("");

  $("cards").innerHTML = rows
    .map((it) => {
      const st = stockState(it);
      const color = colorFor(it.category);
      const stockTag = st.label ? `<span class="tag ${st.key}">${st.label}</span>` : "";
      const statusTag = it.status ? `<span class="tag ${statusClass(it.status)}">${escapeHtml(it.status)}</span>` : "";
      return `<article class="item-card">
        <div class="card-top">
          <span class="mono">${escapeHtml(dash(it.itemNumber))}</span>
          <span class="card-tags">${statusTag} ${stockTag}</span>
        </div>
        <h4>${escapeHtml(it.description || "Sem descrição")}</h4>
        <p class="card-sub">${escapeHtml(dash(it.brand))} · ${escapeHtml(dash(it.location))}</p>
        <div class="card-facts">
          <span class="cat"><i class="dot" style="background:${color}"></i>${escapeHtml(dash(it.category))}</span>
          ${qtyStepper(it)}
          <span class="price">${it.unitValue === "" || it.unitValue == null ? "—" : money(totalOf(it))}</span>
        </div>
        <div class="row-actions">
          <button class="ghost-mini" data-view="${it.id}">Ver</button>
          <button class="ghost-mini" data-edit="${it.id}">Editar</button>
          <button class="ghost-mini danger" data-del="${it.id}">Excluir</button>
        </div>
      </article>`;
    })
    .join("");
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function formatViewValue(key, item) {
  if (key === "unitValue" || key === "totalValue") return money(key === "totalValue" ? totalOf(item) : item.unitValue);
  if (key === "expiry" || key === "countDate") return formatDate(item[key]);
  return item[key] || "—";
}

function formatDate(value) {
  if (!value) return "—";
  const [y, m, d] = String(value).split("-");
  if (!d) return value;
  return `${d}/${m}/${y}`;
}

function qtyStepper(it) {
  return `<div class="qty-step">
    <button type="button" class="qty-btn" data-qty="${it.id}" data-delta="-1" aria-label="Diminuir quantidade">−</button>
    <span class="qty">${dash(it.qty)}<small> ${escapeHtml(it.unit || "")}</small></span>
    <button type="button" class="qty-btn" data-qty="${it.id}" data-delta="1" aria-label="Aumentar quantidade">+</button>
  </div>`;
}

function render() {
  renderFilters();
  renderKpis();
  renderTable();
}

function syncTotal() {
  const f = $("form");
  $("fieldTotalValue").value = money(Number(f.qty.value || 0) * Number(f.unitValue.value || 0));
}

function openForm(item) {
  editing = item ? item.id : null;
  $("formTitle").textContent = item ? "Editar produto" : "Inserir produto";
  const f = $("form");
  fillCategories(item?.category || "", item?.subcategory || "");
  f.itemNumber.value = item?.itemNumber || nextItemNumber();
  f.description.value = item?.description || "";
  f.brand.value = item?.brand || "";
  f.model.value = item?.model || "";
  f.partNumber.value = item?.partNumber || "";
  f.assetNumber.value = item?.assetNumber || "";
  f.serialNumber.value = item?.serialNumber || "";
  f.application.value = item?.application || "";
  f.unit.value = item?.unit || "";
  f.qty.value = item?.qty ?? "";
  f.condition.value = item?.condition || "";
  f.location.value = item?.location || "";
  f.responsible.value = item?.responsible || "";
  f.status.value = item?.status || "";
  f.minStock.value = item?.minStock ?? "";
  f.maxStock.value = item?.maxStock ?? "";
  f.lot.value = item?.lot || "";
  f.expiry.value = item?.expiry || "";
  f.countDate.value = item?.countDate || "";
  f.unitValue.value = item?.unitValue ?? "";
  f.notes.value = item?.notes || "";
  syncTotal();
  $("overlay").hidden = false;
  f.itemNumber.focus();
}

function closeForm() {
  $("overlay").hidden = true;
  editing = null;
}

function openView(item) {
  viewingId = item.id;
  $("viewTitle").textContent = item.description || item.itemNumber || "Item sem descrição";
  $("viewGrid").innerHTML = VIEW_FIELDS.map(([key, label]) => {
    const wide = key === "description" || key === "notes" || key === "application" ? " wide" : "";
    return `<div class="view-item${wide}"><dt>${label}</dt><dd>${escapeHtml(formatViewValue(key, item))}</dd></div>`;
  }).join("");
  $("viewOverlay").hidden = false;
}

function closeView() {
  $("viewOverlay").hidden = true;
  viewingId = null;
}

function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (el.hidden = true), 2200);
}

function readForm(f) {
  return {
    id: editing || crypto.randomUUID(),
    itemNumber: f.itemNumber.value.trim(),
    category: currentCategory(),
    subcategory: f.subcategory.value.trim(),
    description: f.description.value.trim(),
    brand: f.brand.value.trim(),
    model: f.model.value.trim(),
    partNumber: f.partNumber.value.trim().toUpperCase(),
    assetNumber: f.assetNumber.value.trim(),
    serialNumber: f.serialNumber.value.trim(),
    application: f.application.value.trim(),
    unit: f.unit.value,
    qty: numOrEmpty(f.qty.value),
    condition: f.condition.value,
    location: f.location.value.trim(),
    responsible: f.responsible.value.trim(),
    unitValue: numOrEmpty(f.unitValue.value),
    minStock: numOrEmpty(f.minStock.value),
    maxStock: numOrEmpty(f.maxStock.value),
    lot: f.lot.value.trim(),
    expiry: f.expiry.value,
    status: f.status.value,
    countDate: f.countDate.value,
    notes: f.notes.value.trim(),
  };
}

function fillQuickCategories(selected) {
  const cats = allCategoryOptions();
  const isCustom = selected && !cats.includes(selected);
  $("quickCategoryPick").innerHTML =
    `<option value="">—</option>` +
    cats.map((c) => `<option value="${escapeHtml(c)}" ${c === selected ? "selected" : ""}>${escapeHtml(c)}</option>`).join("") +
    `<option value="${NEW_CAT}">＋ Criar nova categoria</option>`;
  if (isCustom) {
    $("quickCategoryPick").value = NEW_CAT;
    $("quickCategoryNew").value = selected;
    $("quickNewCatWrap").hidden = false;
  } else {
    $("quickCategoryNew").value = "";
    $("quickNewCatWrap").hidden = true;
    if (selected) $("quickCategoryPick").value = selected;
  }
}

function currentQuickCategory() {
  const pick = $("quickCategoryPick").value;
  if (pick === NEW_CAT) return $("quickCategoryNew").value.trim();
  return pick;
}

function readQuickPreset() {
  return {
    partNumber: $("quickPartNumber").value.trim().toUpperCase(),
    description: $("quickDescription").value.trim(),
    category: currentQuickCategory(),
    qty: numOrEmpty($("quickQty").value),
    unitValue: numOrEmpty($("quickUnitValue").value),
  };
}

function openQuick(preset = {}) {
  $("quickForm").reset();
  $("quickQty").value = preset.qty ?? 1;
  $("quickPartNumber").value = preset.partNumber || "";
  $("quickDescription").value = preset.description || "";
  $("quickUnitValue").value = preset.unitValue ?? "";
  fillQuickCategories(preset.category || "");
  $("quickOverlay").hidden = false;
  (preset.partNumber ? $("quickDescription") : $("quickPartNumber")).focus();
}

function closeQuick() {
  $("quickOverlay").hidden = true;
}

function blankItem(partial = {}) {
  return {
    id: crypto.randomUUID(),
    itemNumber: nextItemNumber(),
    category: "",
    subcategory: "",
    description: "",
    brand: "",
    model: "",
    partNumber: "",
    assetNumber: "",
    serialNumber: "",
    application: "",
    unit: "UN",
    qty: 1,
    condition: "",
    location: "",
    responsible: "",
    unitValue: "",
    minStock: "",
    maxStock: "",
    lot: "",
    expiry: "",
    status: "Ativo",
    countDate: "",
    notes: "",
    ...partial,
  };
}

function normCode(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function findByCode(code) {
  const c = normCode(code);
  if (!c) return null;
  return (
    items.find((i) =>
      [i.partNumber, i.itemNumber, i.assetNumber, i.serialNumber].some((v) => normCode(v) === c)
    ) || null
  );
}

const pendingQty = new Set();

async function bumpQty(id, delta, { silent } = {}) {
  const item = items.find((i) => i.id === id);
  if (!item || pendingQty.has(id)) return item;
  const current = Number(item.qty || 0);
  const next = Math.max(0, current + Number(delta || 0));
  if (next === current && delta < 0) {
    if (!silent) toast("Quantidade já está em 0");
    return item;
  }
  const prev = item.qty;
  item.qty = next;
  render();
  pendingQty.add(id);
  try {
    await persistItem({ ...item }, true);
    if (!silent) toast(`${item.description || item.partNumber || "Item"} · ${next}`);
  } catch (err) {
    console.error(err);
    item.qty = prev;
    render();
    toast("Não foi possível atualizar a quantidade");
  } finally {
    pendingQty.delete(id);
  }
  return item;
}

let html5Qr = null;
let scanTarget = null;
let scanBusy = false;
let zoomCaps = null;

function scanVideoTrack() {
  const video = $("scanReader")?.querySelector("video");
  return video?.srcObject?.getVideoTracks?.()[0] || null;
}

function resetZoomBar() {
  zoomCaps = null;
  $("zoomBar").hidden = true;
  $("zoomRange").disabled = false;
  $("zoomIn").disabled = false;
  $("zoomOut").disabled = false;
  $("zoomRange").value = 1;
  $("zoomLabel").textContent = "1.0×";
  $("scanHint").textContent = "Aumente o zoom e segure o código a uns 20 cm. Encostar na lente tira o foco.";
}

async function applyCameraTuning(zoomValue) {
  const track = scanVideoTrack();
  if (!track || $("scanOverlay").hidden) return;
  const caps = track.getCapabilities?.() || {};
  const advanced = [];
  if (Array.isArray(caps.focusMode) && caps.focusMode.includes("continuous")) {
    advanced.push({ focusMode: "continuous" });
  }
  if (zoomCaps && zoomValue != null) {
    const zoom = Math.min(zoomCaps.max, Math.max(zoomCaps.min, Number(zoomValue)));
    advanced.push({ zoom });
    $("zoomRange").value = zoom;
    $("zoomLabel").textContent = `${zoom.toFixed(1)}×`;
  }
  if (!advanced.length) return;
  try {
    await track.applyConstraints({ advanced });
  } catch (err) {
    console.warn(err);
  }
}

async function tuneCamera() {
  const track = scanVideoTrack();
  if (!track) return;
  const caps = track.getCapabilities?.() || {};
  const zoom = caps.zoom;
  if (zoom && zoom.max > zoom.min) {
    zoomCaps = zoom;
    const range = $("zoomRange");
    range.min = String(zoom.min);
    range.max = String(zoom.max);
    range.step = String(zoom.step || 0.1);
    range.disabled = false;
    $("zoomIn").disabled = false;
    $("zoomOut").disabled = false;
    const start = zoom.min <= 2 && zoom.max >= 2 ? 2 : zoom.min + (zoom.max - zoom.min) * 0.4;
    $("zoomBar").hidden = false;
    await applyCameraTuning(start);
    $("scanHint").textContent = "Use o zoom e mantenha o código a uns 20 cm, sem encostar na lente.";
  } else {
    zoomCaps = null;
    $("zoomBar").hidden = true;
    $("scanHint").textContent = "Este aparelho não libera zoom. Segure o código a uns 20 cm, sem encostar na lente.";
    await applyCameraTuning(null);
  }
  setTimeout(() => {
    if (!$("scanOverlay").hidden) applyCameraTuning(zoomCaps ? Number($("zoomRange").value) : null);
  }, 500);
}

function stepZoom(direction) {
  if (!zoomCaps) return;
  const step = Number($("zoomRange").step) || zoomCaps.step || 0.1;
  applyCameraTuning(Number($("zoomRange").value) + direction * step);
}

async function startScan(target) {
  if (html5Qr) await stopScan();
  scanTarget = target;
  scanBusy = false;
  resetZoomBar();
  $("scanOverlay").hidden = false;
  $("scanReader").innerHTML = "";
  if (typeof Html5Qrcode === "undefined") {
    $("scanOverlay").hidden = true;
    toast("Câmera indisponível. Use a pistola no campo de código.");
    return;
  }
  html5Qr = new Html5Qrcode("scanReader");
  try {
    await html5Qr.start(
      { facingMode: "environment" },
      {
        fps: 12,
        qrbox: (w, h) => ({
          width: Math.max(160, Math.floor(w * 0.86)),
          height: Math.max(80, Math.floor(Math.min(h * 0.42, w * 0.36))),
        }),
        videoConstraints: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      },
      (text) => {
        if (scanBusy) return;
        scanBusy = true;
        const value = text;
        stopScan().then(() => applyBarcode(value, target));
      }
    );
    await tuneCamera();
  } catch (err) {
    console.error(err);
    if (html5Qr) {
      try { await html5Qr.stop(); } catch {}
      try { html5Qr.clear(); } catch {}
    }
    html5Qr = null;
    resetZoomBar();
    $("scanReader").innerHTML = `<p class="chart-hint">Câmera indisponível neste dispositivo. Feche e use a pistola USB no campo de código.</p>`;
    toast("Não foi possível abrir a câmera. Use a pistola USB.");
  }
}

async function stopScan() {
  $("scanOverlay").hidden = true;
  resetZoomBar();
  if (html5Qr) {
    try { await html5Qr.stop(); } catch {}
    try { html5Qr.clear(); } catch {}
    html5Qr = null;
  }
  $("scanReader").innerHTML = "";
  scanBusy = false;
}

async function applyBarcode(raw, target) {
  const code = String(raw || "").trim();
  if (!code) return;
  const existing = findByCode(code);

  if (target === "lookup") {
    if (existing) await bumpQty(existing.id, 1);
    else {
      openQuick({ partNumber: code.toUpperCase() });
      toast("Código novo · complete o cadastro");
    }
    return;
  }

  const input = $(target);
  if (input) {
    input.value = code.toUpperCase();
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  if (target === "quickPartNumber" && existing) {
    const qty = Number($("quickQty").value || 1) || 1;
    closeQuick();
    await bumpQty(existing.id, qty);
  }
}

$("btnQuick").onclick = () => openQuick();
$("emptyInsert").onclick = () => openQuick();
$("btnInsert").onclick = () => openForm();
$("btnQuickClose").onclick = closeQuick;
$("btnQuickToFull").onclick = () => {
  const preset = readQuickPreset();
  closeQuick();
  openForm(preset);
};
$("btnClose").onclick = closeForm;
$("btnCancel").onclick = closeForm;
$("btnViewClose").onclick = closeView;
$("btnViewCancel").onclick = closeView;
$("btnViewEdit").onclick = () => {
  const item = items.find((i) => i.id === viewingId);
  closeView();
  if (item) openForm(item);
};

$("overlay").addEventListener("click", (e) => {
  if (e.target === $("overlay")) closeForm();
});
$("viewOverlay").addEventListener("click", (e) => {
  if (e.target === $("viewOverlay")) closeView();
});
$("quickOverlay").addEventListener("click", (e) => {
  if (e.target === $("quickOverlay")) closeQuick();
});
$("scanOverlay").addEventListener("click", (e) => {
  if (e.target === $("scanOverlay")) stopScan();
});

$("quickCategoryPick").addEventListener("change", () => {
  const isNew = $("quickCategoryPick").value === NEW_CAT;
  $("quickNewCatWrap").hidden = !isNew;
  if (isNew) $("quickCategoryNew").focus();
  else $("quickCategoryNew").value = "";
});

$("quickForm").onsubmit = async (e) => {
  e.preventDefault();
  const preset = readQuickPreset();
  if (!preset.description && !preset.partNumber) {
    toast("Informe a descrição ou o código");
    return;
  }
  if (preset.partNumber) {
    const existing = findByCode(preset.partNumber);
    if (existing) {
      const add = Number(preset.qty || 1) || 1;
      closeQuick();
      await bumpQty(existing.id, add);
      return;
    }
  }
  const data = blankItem(preset);
  try {
    await persistItem(data, false);
    await rememberCategory(data.category);
    items.unshift(data);
    toast("Produto inserido no inventário");
    closeQuick();
    render();
  } catch (err) {
    console.error(err);
    if (isMissingTable(err)) showSetup();
    else toast("Não foi possível salvar no Supabase");
  }
};

$("quickPartNumber").addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  applyBarcode($("quickPartNumber").value, "quickPartNumber");
});
$("fieldPartNumber").addEventListener("keydown", (e) => {
  if (e.key === "Enter") e.preventDefault();
});

$("btnScanLookup").onclick = () => startScan("lookup");
$("btnScanClose").onclick = () => stopScan();
$("btnScanCancel").onclick = () => stopScan();
$("zoomRange").oninput = () => applyCameraTuning($("zoomRange").value);
$("zoomIn").onclick = () => stepZoom(1);
$("zoomOut").onclick = () => stepZoom(-1);
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-scan]");
  if (!btn) return;
  startScan(btn.dataset.scan);
});

$("fieldCategoryPick").addEventListener("change", () => {
  const isNew = $("fieldCategoryPick").value === NEW_CAT;
  toggleNewCategory(isNew);
  if (!isNew) $("fieldCategoryNew").value = "";
  fillSubcategories(currentCategory());
});
$("fieldCategoryNew").addEventListener("input", () => fillSubcategories(currentCategory()));
$("filterPrev").onclick = () => $("filters").scrollBy({ left: -240, behavior: "smooth" });
$("filterNext").onclick = () => $("filters").scrollBy({ left: 240, behavior: "smooth" });
$("filters").addEventListener("scroll", updateFilterArrows, { passive: true });
window.addEventListener("resize", updateFilterArrows);
$("form").addEventListener("input", (e) => {
  if (e.target.name === "qty" || e.target.name === "unitValue") syncTotal();
});

$("form").onsubmit = async (e) => {
  e.preventDefault();
  const data = readForm(e.target);
  const isEdit = Boolean(editing);
  try {
    await persistItem(data, isEdit);
    await rememberCategory(data.category);
    if (isEdit) items = items.map((i) => (i.id === data.id ? data : i));
    else items.unshift(data);
    toast(isEdit ? "Produto atualizado" : "Produto inserido no inventário");
    closeForm();
    render();
  } catch (err) {
    console.error(err);
    if (isMissingTable(err)) showSetup();
    else toast("Não foi possível salvar no Supabase");
  }
};

$("filters").onclick = (e) => {
  const btn = e.target.closest("[data-cat]");
  if (!btn) return;
  filter = btn.dataset.cat;
  render();
};

$("search").oninput = renderTable;

async function onListClick(e) {
  const qtyBtn = e.target.closest("[data-qty]");
  if (qtyBtn) {
    e.preventDefault();
    await bumpQty(qtyBtn.dataset.qty, Number(qtyBtn.dataset.delta), { silent: true });
    return;
  }
  const view = e.target.closest("[data-view]");
  const edit = e.target.closest("[data-edit]");
  const del = e.target.closest("[data-del]");
  if (view) {
    const item = items.find((i) => i.id === view.dataset.view);
    if (item) openView(item);
  }
  if (edit) {
    const item = items.find((i) => i.id === edit.dataset.edit);
    if (item) openForm(item);
  }
  if (del) {
    const item = items.find((i) => i.id === del.dataset.del);
    if (!item) return;
    if (confirm(`Remover “${item.description || item.itemNumber || "este item"}” do inventário?`)) {
      try {
        await persistDelete(item.id);
        items = items.filter((i) => i.id !== item.id);
        render();
        toast("Produto removido");
      } catch (err) {
        console.error(err);
        toast("Não foi possível remover no Supabase");
      }
    }
  }
}

$("tbody").onclick = onListClick;
$("cards").onclick = onListClick;

$("btnCopySql").onclick = async () => {
  try {
    await navigator.clipboard.writeText(SCHEMA_SQL);
    toast("SQL copiado");
  } catch {
    toast("Copie o texto do quadro");
  }
};
$("btnReload").onclick = () => location.reload();

$("today").textContent = new Date().toLocaleDateString("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
});

async function init() {
  try {
    await fetchAll();
    await migrateLocalIfNeeded();
  } catch (err) {
    console.error(err);
    if (isMissingTable(err)) {
      showSetup();
      render();
      return;
    }
    toast("Falha ao conectar no Supabase");
  }
  render();
}

init();
