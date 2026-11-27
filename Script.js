
// DEN TRACK - Debt Management System

// Load saved records
let customers = JSON.parse(localStorage.getItem("denTrackCustomers")) || [];

// Save records
function saveCustomers() {
    localStorage.setItem(
        "denTrackCustomers",
        JSON.stringify(customers)
    );
    updateDashboard();
    displayCustomers();
}

// Register a new customer
function addCustomer(name, phone, amount, description) {
    if (!name || !phone || amount <= 0) {
        alert("Please enter valid customer details.");
        return;
    }

    const customer = {
        id: Date.now(),
        name: name.trim(),
        phone: phone.trim(),
        amount: Number(amount),
        description: description || "General debt",
        repayments: [],
        createdAt: new Date().toISOString()
    };

    customers.push(customer);
    saveCustomers();

    alert("Customer registered successfully!");
}

// Calculate outstanding balance
function getBalance(customer) {
    const paid = customer.repayments.reduce(
        (total, payment) => total + payment.amount,
        0
    );

    return Math.max(0, customer.amount - paid);
}

// Record repayment
function recordPayment(customerId, amount) {
    const customer = customers.find(
        item => item.id === Number(customerId)
    );

    amount = Number(amount);

    if (!customer || amount <= 0) {
        alert("Invalid customer or repayment amount.");
        return;
    }

    const balance = getBalance(customer);

    if (amount > balance) {
        alert("Payment cannot exceed the outstanding balance.");
        return;
    }

    customer.repayments.push({
        amount: amount,
        date: new Date().toISOString()
    });

    saveCustomers();
    alert("Repayment recorded successfully!");
}

// Delete customer
function deleteCustomer(customerId) {
    const confirmed = confirm(
        "Are you sure you want to delete this customer?"
    );

    if (!confirmed) return;

    customers = customers.filter(
        customer => customer.id !== Number(customerId)
    );

    saveCustomers();
}

// Display customers
function displayCustomers(searchTerm = "") {
    const table = document.getElementById("customerList");

    if (!table) return;

    table.innerHTML = "";

    const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(
            searchTerm.toLowerCase()
        ) ||
        customer.phone.includes(searchTerm)
    );

    filtered.forEach(customer => {
        const balance = getBalance(customer);

        const row = document.createElement("tr");

        const values = [
            customer.name,
            customer.phone,
            `KES ${customer.amount.toLocaleString()}`,
            `KES ${balance.toLocaleString()}`,
            balance === 0 ? "Paid" : "Pending"
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actionCell = document.createElement("td");

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.onclick = () => deleteCustomer(customer.id);

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        table.appendChild(row);
    });
}

// Dashboard statistics
function updateDashboard() {
    const totalDebt = customers.reduce(
        (sum, customer) => sum + customer.amount,
        0
    );

    const totalPaid = customers.reduce(
        (sum, customer) =>
            sum + customer.repayments.reduce(
                (total, payment) => total + payment.amount,
                0
            ),
        0
    );

    const outstanding = totalDebt - totalPaid;

    const totalCustomers = document.getElementById("totalCustomers");
    const totalDebtElement = document.getElementById("totalDebt");
    const totalPaidElement = document.getElementById("totalPaid");
    const outstandingElement = document.getElementById("outstanding");

    if (totalCustomers)
        totalCustomers.textContent = customers.length;

    if (totalDebtElement)
        totalDebtElement.textContent =
            `KES ${totalDebt.toLocaleString()}`;

    if (totalPaidElement)
        totalPaidElement.textContent =
            `KES ${totalPaid.toLocaleString()}`;

    if (outstandingElement)
        outstandingElement.textContent =
            `KES ${outstanding.toLocaleString()}`;
}

// Search customers
function searchCustomers() {
    const searchInput = document.getElementById("searchCustomer");

    if (searchInput) {
        displayCustomers(searchInput.value);
    }
}

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
    updateDashboard();
    displayCustomers();
});
                    
