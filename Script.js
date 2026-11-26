script
// DENITRACK - BUSINESS EDITION
// Version 1.0

let customers = JSON.parse(localStorage.getItem("dt_customers") || "[]");
let debts = JSON.parse(localStorage.getItem("dt_debts") || "[]");
let payments = JSON.parse(localStorage.getItem("dt_payments") || "[]");

const $ = id => document.getElementById(id);

function saveData() {
  localStorage.setItem("dt_customers", JSON.stringify(customers));
  localStorage.setItem("dt_debts", JSON.stringify(debts));
  localStorage.setItem("dt_payments", JSON.stringify(payments));
}

function money(amount) {
  return "KES " + Number(amount).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function today() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000)
    .toISOString().slice(0, 10);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function customerName(id) {
  const customer = customers.find(c => c.id === id);
  return customer ? customer.name : "Unknown customer";
}

function totalPaid(debtId) {
  return payments
    .filter(p => p.debtId === debtId)
    .reduce((sum, p) => sum + p.amount, 0);
}

function balance(debt) {
  return Math.max(0, debt.amount - totalPaid(debt.id));
}

// REGISTER CUSTOMER
$("customerForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const customer = {
    id: crypto.randomUUID(),
    name: $("customerName").value.trim(),
    phone: $("customerPhone").value.trim(),
    location: $("customerLocation").value.trim(),
    createdAt: today()
  };

  if (!customer.name || !customer.phone) {
    alert("Enter the customer's name and phone number.");
    return;
  }

  customers.push(customer);
  saveData();
  this.reset();
  render();

  alert("Customer registered successfully!");
});

// UPDATE CUSTOMER LIST
function renderCustomers() {
  $("debtCustomer").innerHTML =
    '<option value="">Select customer</option>';

  customers.forEach(c => {
    $("debtCustomer").innerHTML +=
      `<option value="${c.id}">${escapeHTML(c.name)} - ${escapeHTML(c.phone)}</option>`;
  });
}

// AUTOMATIC COMMODITY CALCULATION
function calculateCommodity() {
  if ($("debtType").value !== "Commodity") return;

  const quantity = Number($("quantity").value);
  const price = Number($("unitPrice").value);

  if (quantity > 0 && price > 0) {
    $("debtAmount").value = (quantity * price).toFixed(2);
  }
}

$("quantity").addEventListener("input", calculateCommodity);
$("unitPrice").addEventListener("input", calculateCommodity);

$("debtType").addEventListener("change", function() {
  const isCommodity = this.value === "Commodity";

  $("commodityFields").style.display =
    isCommodity ? "grid" : "none";

  $("quantity").required = isCommodity;
  $("unitPrice").required = isCommodity;

  $("quantity").value = "";
  $("unitPrice").value = "";
  $("debtAmount").value = "";
});

// RECORD NEW DEBT
$("debtForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const customerId = $("debtCustomer").value;
  const type = $("debtType").value;
  const amount = Number($("debtAmount").value);
  const description = $("description").value.trim();

  if (!customers.some(c => c.id === customerId)) {
    alert("Please select a registered customer.");
    return;
  }

  if (!description || !Number.isFinite(amount) || amount <= 0) {
    alert("Enter a valid description and debt amount.");
    return;
  }

  const quantity = type === "Commodity"
    ? Number($("quantity").value)
    : null;

  const unitPrice = type === "Commodity"
    ? Number($("unitPrice").value)
    : null;

  if (type === "Commodity" &&
      (!(quantity > 0) || !(unitPrice > 0) ||
       Math.abs(quantity * unitPrice - amount) > 0.01)) {
    alert("Check the commodity quantity, price and total.");
    return;
  }

  const debtDate = $("debtDate").value;
  const dueDate = $("dueDate").value;

  if (!debtDate || (dueDate && dueDate < debtDate)) {
    alert("Check the debt date and expected payment date.");
    return;
  }

  const debt = {
    id: crypto.randomUUID(),
    customerId,
    type,
    description,
    quantity,
    unitPrice,
    amount,
    date: debtDate,
    dueDate
  };

  debts.push(debt);
  saveData();
  this.reset();

  $("debtDate").value = today();
  $("commodityFields").style.display = "none";

  render();
  alert("Debt recorded successfully!");
});

// UPDATE OUTSTANDING DEBTS LIST
function renderDebtOptions() {
  const select = $("paymentDebt");
  select.innerHTML =
    '<option value="">Select outstanding debt</option>';

  debts.forEach(debt => {
    const remaining = balance(debt);

    if (remaining > 0) {
      const option = document.createElement("option");
      option.value = debt.id;
      option.textContent =
        `${customerName(debt.customerId)} - ${debt.description} - ${money(remaining)}`;
      select.appendChild(option);
    }
  });
}

// RECORD CUSTOMER PAYMENT
$("paymentForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const debtId = $("paymentDebt").value;
  const debt = debts.find(d => d.id === debtId);
  const amount = Number($("paymentAmount").value);
  const date = $("paymentDate").value;

  if (!debt || !Number.isFinite(amount) || amount <= 0) {
    alert("Select a debt and enter a valid payment.");
    return;
  }

  const remaining = balance(debt);

  if (amount > remaining + 0.001) {
    alert("Payment cannot exceed the remaining balance of " +
      money(remaining));
    return;
  }

  if (!date || date < debt.date || date > today()) {
    alert("Enter a valid payment date.");
    return;
  }

  payments.push({
    id: crypto.randomUUID(),
    debtId,
    amount,
    date,
    method: $("paymentMethod").value
  });

  saveData();
  this.reset();
  $("paymentDate").value = today();

  render();
  alert("Payment recorded successfully!");
});

// DASHBOARD CALCULATIONS
function renderDashboard() {
  const debtTotal = debts.reduce((sum, d) => sum + d.amount, 0);

  const paidTotal = payments.reduce(
    (sum, p) => sum + p.amount, 0
  );

  const outstanding = debts.reduce(
    (sum, d) => sum + balance(d), 0
  );

  $("totalDebt").textContent = money(debtTotal);
  $("totalPaid").textContent = money(paidTotal);
  $("totalBalance").textContent = money(outstanding);
  $("totalCustomers").textContent = customers.length;
}

// DISPLAY DEBT RECORDS
function renderDebts() {
  const search = $("search").value.toLowerCase();

  const filtered = debts.filter(debt => {
    const name = customerName(debt.customerId).toLowerCase();
    const description = debt.description.toLowerCase();

    return name.includes(search) || description.includes(search);
  });

  const table = $("debtTable");
  table.innerHTML = "";

  if (filtered.length === 0) {
    table.innerHTML =
      '<tr><td colspan="7">No debt records found.</td></tr>';
    return;
  }

  filtered.forEach(debt => {
    const paid = totalPaid(debt.id);
    const remaining = balance(debt);

    let status = "pending";
    let label = "Partially paid";

    if (remaining <= 0) {
      status = "paid";
      label = "Fully paid";
    } else if (debt.dueDate && debt.dueDate < today()) {
      status = "overdue";
      label = "Overdue";
    }

    const commodityInfo = debt.type === "Commodity"
      ? `${debt.description} (${debt.quantity})`
      : debt.description;

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHTML(customerName(debt.customerId))}</td>
      <td>${escapeHTML(debt.type)}: ${escapeHTML(commodityInfo)}</td>
      <td>${escapeHTML(debt.date)}</td>
      <td>${money(debt.amount)}</td>
      <td>${money(paid)}</td>
      <td><strong>${money(remaining)}</strong></td>
      <td><span class="status ${status}">${label}</span></td>
    `;

    table.appendChild(row);
  });
}

// DISPLAY PAYMENT HISTORY
function renderPayments() {
  const table = $("paymentTable");
  table.innerHTML = "";

  const sorted = [...payments].sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  if (sorted.length === 0) {
    table.innerHTML =
      '<tr><td colspan="4">No payments recorded yet.</td></tr>';
    return;
  }

  sorted.forEach(payment => {
    const debt = debts.find(d => d.id === payment.debtId);
    if (!debt) return;

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHTML(customerName(debt.customerId))}</td>
      <td>${escapeHTML(payment.date)}</td>
      <td>${money(payment.amount)}</td>
      <td>${escapeHTML(payment.method)}</td>
    `;

    table.appendChild(row);
  });
}

// REFRESH THE WHOLE APPLICATION
function render() {
  renderCustomers();
  renderDebtOptions();
  renderDashboard();
  renderDebts();
  renderPayments();
}

// SEARCH CUSTOMERS AND DEBTS
$("search").addEventListener("input", renderDebts);

// INITIALIZE APPLICATION
$("debtDate").value = today();
$("paymentDate").value = today();
$("commodityFields").style.display = "none";

render();
    
