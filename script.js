class FoodPriceCalculator {
  constructor() {
    this.selectedItems = [];
    this.currentInput = "0";
    this.display = document.getElementById("result");
    this.expression = "";
    this.history = [];
    this.historyList = [];

    this.initialize();
    this.initializeMenu();
    this.loadHistory();
  }

  initialize() {
    // Initialize calculator buttons
    document.querySelectorAll(".buttons button").forEach((button) => {
      button.addEventListener("click", () => {
        const value =
          button.getAttribute("data-value") || button.textContent.trim();
        this.handleInput(value, button);
      });
    });

    // Initialize keyboard support
    document.addEventListener("keydown", (e) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        this.backspace();
      }
    });
  }

  initializeMenu() {
    // Create and setup hamburger menu button
    const menuBtn = document.createElement("button");
    menuBtn.id = "toggle-menu";
    menuBtn.className = "menu-btn";
    menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    document.querySelector(".calculator").appendChild(menuBtn);

    // Toggle menu visibility
    menuBtn.addEventListener("click", () => {
      document.querySelector(".sidebar-menu").classList.toggle("active");
    });

    // Close menu button
    document.getElementById("close-menu").addEventListener("click", () => {
      document.querySelector(".sidebar-menu").classList.remove("active");
    });

    // Clear history button
    document.getElementById("clear-history").addEventListener("click", () => {
      this.historyList = [];
      this.updateHistoryDisplay();
      localStorage.removeItem("foodCalculatorHistory");
    });

    // Initialize year dropdown
    const currentYear = new Date().getFullYear();
    const yearSelect = document.getElementById("report-year");
    yearSelect.innerHTML = ""; // Clear existing options
    for (let year = currentYear; year >= currentYear - 2; year--) {
      yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
    }

    // Set current month as default
    const currentMonth = new Date().getMonth() + 1;
    document.getElementById("report-month").value = currentMonth;

    // Export to Excel functionality
    document.getElementById("export-history").addEventListener("click", () => {
      const month = document.getElementById("report-month").value;
      const year = document.getElementById("report-year").value;
      this.generateMonthlyReport(month, year);
    });
  }

  loadHistory() {
    // Load history from localStorage
    const savedHistory = localStorage.getItem("foodCalculatorHistory");
    if (savedHistory) {
      this.historyList = JSON.parse(savedHistory);
      this.updateHistoryDisplay();
    }
  }

  handleInput(value, button = null) {
    if (value === "C") {
      this.clearAll();
    } else if (value === "⌫") {
      this.backspace();
    } else if (value === "=") {
      this.calculate();
    } else if (["+", "×"].includes(value)) {
      this.addToExpression(value);
    } else if (value.match(/^\d+$/)) {
      this.appendNumber(value);
    } else if (value.match(/Rp \d+k/)) {
      const numericValue = value.match(/\d+/)[0];
      this.addFoodPrice(parseInt(numericValue) * 1000, button);
    } else if (button && button.getAttribute("data-value")) {
      this.addFoodPrice(parseInt(button.getAttribute("data-value")), button);
    }

    this.updateDisplay();
  }

  appendNumber(number) {
    if (this.currentInput === "0") {
      this.currentInput = number;
    } else {
      this.currentInput += number;
    }
  }

  addFoodPrice(price, button) {
    this.currentInput = price.toString();
    this.expression = price.toString();

    if (button) {
      const foodName = button.getAttribute("aria-label").split(" Rp")[0];
      this.selectedItems.push(`${foodName} (${this.formatCurrency(price)})`);
      this.history.push(`${foodName}(${this.formatCurrency(price)})`);
    } else {
      this.history.push(this.formatCurrency(price));
    }
  }

  addToExpression(operator) {
    if (this.currentInput !== "0") {
      this.expression += this.currentInput + " " + operator + " ";
      this.history.push(this.currentInput, operator);
      this.currentInput = "0";
    } else if (
      this.expression.endsWith("+ ") ||
      this.expression.endsWith("× ")
    ) {
      this.expression = this.expression.slice(0, -2) + operator + " ";
      this.history[this.history.length - 1] = operator;
    }
  }

  calculate() {
    if (this.currentInput !== "0") {
      this.expression += this.currentInput;
      this.history.push(this.currentInput);
    }

    let cleanExpression = this.expression
      .replace(/Rp\s?\d+(\.\d{3})*(,\d+)?/g, (match) => {
        return match.replace(/[^\d]/g, "");
      })
      .replace(/×/g, "*");

    try {
      const result = new Function("return " + cleanExpression)();
      this.currentInput = result.toString();

      // Save to history
      const historyEntry = {
        expression: this.expression,
        total: this.formatCurrency(result),
        items: [...this.selectedItems],
        timestamp: new Date().toISOString(),
      };
      this.saveToHistory(historyEntry);

      this.expression =
        this.history.join(" ") + " = " + this.formatCurrency(result);
      this.history = [];
    } catch (error) {
      this.currentInput = "Error";
      this.expression = "";
      this.history = [];
    }
  }

  saveToHistory(calculation) {
    this.historyList.unshift(calculation);
    if (this.historyList.length > 10) {
      this.historyList.pop();
    }
    localStorage.setItem(
      "foodCalculatorHistory",
      JSON.stringify(this.historyList)
    );
    this.updateHistoryDisplay();
  }

  updateHistoryDisplay() {
    const historyListEl = document.getElementById("history-list");
    historyListEl.innerHTML = "";

    this.historyList.forEach((item, index) => {
      const historyItem = document.createElement("div");
      historyItem.className = "history-item";
      historyItem.innerHTML = `
                <div><strong>${index + 1}.</strong> ${item.expression}</div>
                <div>${item.total}</div>
                <small>${new Date(item.timestamp).toLocaleTimeString()}</small>
            `;

      historyItem.addEventListener("click", () => {
        this.expression = item.expression;
        this.currentInput = item.total.replace("Rp ", "");
        this.selectedItems = [...item.items];
        this.updateDisplay();
        document.querySelector(".sidebar-menu").classList.remove("active");
      });

      historyListEl.appendChild(historyItem);
    });
  }

  generateMonthlyReport(month, year) {
    try {
      // 1. Filter data by month and year
      const monthlyData = this.historyList.filter((item) => {
        const date = new Date(item.timestamp);
        return date.getMonth() + 1 == month && date.getFullYear() == year;
      });

      if (monthlyData.length === 0) {
        alert(`Tidak ada data transaksi untuk bulan ${month}-${year}`);
        return;
      }

      // 2. Create workbook
      const wb = XLSX.utils.book_new();

      // 3. Prepare data with Excel-friendly formatting
      const wsData = [
        ["No", "Tanggal", "Items", "Total (Rp)", "Detail Transaksi"],
        ...monthlyData.map((item, index) => [
          index + 1,
          XLSX.SSF.format("dd-mm-yyyy", new Date(item.timestamp)), // Excel-safe date format
          item.items.join(", "),
          Number(item.total.replace(/[^\d]/g, "")), // Convert to pure number
          item.expression,
        ]),
      ];

      // 4. Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // 5. Set column widths
      ws["!cols"] = [
        { wch: 5 }, // No
        { wch: 12 }, // Tanggal (DD-MM-YYYY)
        { wch: 30 }, // Items
        { wch: 15 }, // Total
        { wch: 50 }, // Detail
      ];

      // 6. Format currency for Total column
      for (let i = 1; i < wsData.length; i++) {
        const cellRef = XLSX.utils.encode_cell({ r: i, c: 3 });
        if (!ws[cellRef]) ws[cellRef] = {};
        ws[cellRef].z = '"Rp"#,##0;[Red]"Rp"-#,##0'; // Currency format
      }

      // 7. Add to workbook
      XLSX.utils.book_append_sheet(wb, ws, `Laporan ${month}-${year}`);

      // 8. Export file
      const monthNames = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ];
      const monthName = monthNames[month - 1];

      XLSX.writeFile(wb, `Laporan_Transaksi_${monthName}_${year}.xlsx`, {
        bookType: "xlsx",
        type: "array",
      });

      console.log("Laporan berhasil diexport!");
    } catch (error) {
      console.error("Error saat mengekspor laporan:", error);
      alert("Terjadi kesalahan saat mengekspor laporan. Silakan coba lagi.");
    }
  }

  backspace() {
    if (this.currentInput.length > 1) {
      this.currentInput = this.currentInput.slice(0, -1);
    } else {
      this.currentInput = "0";
    }
    this.updateDisplay();
  }

  clearAll() {
    this.currentInput = "0";
    this.selectedItems = [];
    this.expression = "";
    this.history = [];
  }

  formatCurrency(value) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    })
      .format(value || 0)
      .replace("IDR", "Rp");
  }

  updateDisplay() {
    const calcArea = this.display.querySelector(".calculation-area");
    const foodArea = this.display.querySelector(".food-items-area");

    // Update calculation area
    let calcHtml = "";
    if (this.expression.includes("=")) {
      const parts = this.expression.split(" = ");
      calcHtml += `<div class="perhitungan">${parts[0]}</div>`;
      calcHtml += `<div class="hasil">= ${parts[1]}</div>`;
    } else {
      calcHtml += `<div class="perhitungan">${this.history.join(" ")} ${
        this.currentInput !== "0" ? this.currentInput : ""
      }</div>`;
    }
    calcArea.innerHTML = calcHtml;
    calcArea.scrollTop = calcArea.scrollHeight;

    // Update food items area
    let foodHtml = "";
    if (this.selectedItems.length > 0) {
      this.selectedItems.forEach((item) => {
        foodHtml += `<div class="item-makanan">${item}</div>`;
      });
    }
    foodArea.innerHTML = foodHtml;
    foodArea.scrollTop = foodArea.scrollHeight;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new FoodPriceCalculator();
});
