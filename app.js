const STORAGE_KEY = "forfettario_invoices_v1";

const € = n => new Intl.NumberFormat("it-IT", {
  style: "currency", currency: "EUR"
}).format(Number(n || 0));

const amountEl = document.getElementById("invoiceAmount");
const descEl = document.getElementById("invoiceDescription");

function parseAmount(v){
  if(!v) return 0;
  let s = String(v).trim().replace(/\s/g,"").replace(/€/g,"");
  if(s.includes(",") && s.includes(".")) s = s.replace(/\./g,"").replace(",",".");
  else if(s.includes(",")) s = s.replace(",",".");
  return Number(s) || 0;
}

function calc(gross){
  const taxable = gross * 0.78;
  const inps = taxable * 0.267;
  const tax = (taxable - inps) * 0.05;
  const net = taxable - inps - tax;
  const quota22 = gross * 0.22;
  const netPlus = net + quota22;
  return {gross,taxable,inps,tax,net,quota22,netPlus};
}

function currentCalc(){
  return calc(parseAmount(amountEl.value));
}

function updateCurrent(){
  const c = currentCalc();
  document.getElementById("taxable").textContent = €(c.taxable);
  document.getElementById("inps").textContent = €(c.inps);
  document.getElementById("tax").textContent = €(c.tax);
  document.getElementById("net").textContent = €(c.net);
  document.getElementById("quota22").textContent = €(c.quota22);
  document.getElementById("netPlus").textContent = €(c.netPlus);
}

function getInvoices(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function setInvoices(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function updateTotals(){
  const invoices = getInvoices();
  const totals = invoices.reduce((a,inv)=>{
    a.gross += inv.gross;
    a.inps += inv.inps;
    a.tax += inv.tax;
    a.netPlus += inv.netPlus;
    return a;
  }, {gross:0,inps:0,tax:0,netPlus:0});

  document.getElementById("totalGross").textContent = €(totals.gross);
  document.getElementById("totalInps").textContent = €(totals.inps);
  document.getElementById("totalTax").textContent = €(totals.tax);
  document.getElementById("totalReserve").textContent = €(totals.inps + totals.tax);
  document.getElementById("totalNet").textContent = €(totals.netPlus);
}

function renderInvoices(){
  const list = getInvoices();
  const box = document.getElementById("invoiceList");
  const empty = document.getElementById("emptyState");
  box.innerHTML = "";
  empty.style.display = list.length ? "none" : "block";

  [...list].reverse().forEach(inv=>{
    const el = document.createElement("article");
    el.className = "invoice-item";
    el.innerHTML = `
      <div class="invoice-top">
        <strong>${€(inv.gross)}</strong>
        <span>${new Date(inv.date).toLocaleDateString("it-IT")}</span>
      </div>
      <div class="invoice-desc">${inv.description || "Nessuna descrizione"}</div>
      <div class="invoice-meta">
        Imponibile: ${€(inv.taxable)} · INPS: ${€(inv.inps)} · Imposta: ${€(inv.tax)}<br>
        Netto + quota 22%: <strong>${€(inv.netPlus)}</strong>
      </div>
      <div class="invoice-actions">
        <button data-id="${inv.id}">Elimina</button>
      </div>`;
    el.querySelector("button").addEventListener("click", ()=>{
      const next = getInvoices().filter(x => x.id !== inv.id);
      setInvoices(next);
      renderInvoices();
      updateTotals();
    });
    box.appendChild(el);
  });
}

amountEl.addEventListener("input", updateCurrent);

document.getElementById("saveInvoiceBtn").addEventListener("click", ()=>{
  const gross = parseAmount(amountEl.value);
  if(gross <= 0){
    alert("Inserisci un importo valido.");
    return;
  }
  const c = calc(gross);
  const invoices = getInvoices();
  invoices.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    date: new Date().toISOString(),
    description: descEl.value.trim(),
    ...c
  });
  setInvoices(invoices);
  amountEl.value = "";
  descEl.value = "";
  updateCurrent();
  updateTotals();
  renderInvoices();
  alert("Fattura registrata.");
});

document.getElementById("clearAllBtn").addEventListener("click", ()=>{
  if(confirm("Vuoi cancellare tutto lo storico delle fatture?")){
    setInvoices([]);
    renderInvoices();
    updateTotals();
  }
});

const dashboardView = document.getElementById("dashboardView");
const invoicesView = document.getElementById("invoicesView");
const dashboardTab = document.getElementById("dashboardTab");
const invoicesTab = document.getElementById("invoicesTab");

function show(view){
  const dash = view === "dashboard";
  dashboardView.classList.toggle("active", dash);
  invoicesView.classList.toggle("active", !dash);
  dashboardTab.classList.toggle("active", dash);
  invoicesTab.classList.toggle("active", !dash);
  if(!dash) renderInvoices();
}

dashboardTab.addEventListener("click", ()=>show("dashboard"));
invoicesTab.addEventListener("click", ()=>show("invoices"));

updateCurrent();
updateTotals();
renderInvoices();
