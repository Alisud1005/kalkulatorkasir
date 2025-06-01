class FoodPriceCalculator {
  constructor() {
    this.selectedItems = [];
    this.currentInput = "0";
    this.display = document.getElementById("result");
    this.expression = "";
    this.history = [];
    this.historyList = [];
    
    // Daftar makanan default
    this.defaultFoods = [
      { name: "Pokat", price: "10000", imageSrc: "images/alpukat.jpg", isDefault: true, isDeleted: false },
      { name: "Cappucino", price: "7000", imageSrc: "images/capuccino.jpg", isDefault: true, isDeleted: false },
      { name: "Jeruk", price: "10000", imageSrc: "images/jusjeruk.jpg", isDefault: true, isDeleted: false },
      { name: "Teh Manis", price: "5000", imageSrc: "images/teh.jpg", isDefault: true, isDeleted: false },
      { name: "Manis Dingin", price: "7000", imageSrc: "images/tehmanis.jpg", isDefault: true, isDeleted: false },
      { name: "Kopi Pahit", price: "3000", imageSrc: "images/kopipahit.JPG", isDefault: true, isDeleted: false },
      { name: "Kopi Manis", price: "5000", imageSrc: "images/kopipahit.JPG", isDefault: true, isDeleted: false },
      { name: "Jahe", price: "5000", imageSrc: "images/kopijahe.jpg", isDefault: true, isDeleted: false },
      { name: "Kopi ABC", price: "5000", imageSrc: "images/kopiabc.jpg", isDefault: true, isDeleted: false },
      { name: "Mandi", price: "10000", imageSrc: "images/mandi.jpg", isDefault: true, isDeleted: false },
    ];

    this.initialize();
    this.initializeMenu();
    this.loadHistory();
    this.initializeFoodButton();
    this.loadFoodItems();
    this.initializeDeleteFoodButton();
  }

  // Method untuk inisialisasi tombol hapus
  initializeDeleteFoodButton() {
    const deleteBtn = document.getElementById("delete-food-btn");
    deleteBtn.addEventListener("click", () => {
      this.enterDeleteMode();
    });
  }

  // Method untuk masuk ke mode hapus
  enterDeleteMode() {
    const foodButtons = document.querySelectorAll('button[data-value]');
    const isDeleteMode = !foodButtons[0]?.classList.contains('delete-mode');

    foodButtons.forEach(button => {
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      if (isDeleteMode) {
        newButton.classList.add('delete-mode');
        newButton.addEventListener('click', (e) => this.handleFoodDeletion(e));
      } else {
        newButton.classList.remove('delete-mode');
        const value = newButton.getAttribute('data-value');
        newButton.addEventListener('click', () => {
          this.handleInput(value, newButton);
        });
      }
    });

    if (isDeleteMode) {
      alert('Pilih makanan yang ingin dihapus. Klik lagi tombol "Hapus Makanan" untuk membatalkan.');
    }
  }

  // Method untuk menangani penghapusan makanan
  handleFoodDeletion(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const button = e.currentTarget;
    const foodName = button.querySelector('.food-name').textContent;
    
    if (confirm(`Apakah Anda yakin ingin menghapus "${foodName}" secara permanen?`)) {
      // Hapus tombol dari DOM
      button.remove();
      
      // Update data di localStorage
      const savedData = localStorage.getItem('foodItems');
      let savedFoods = [];
      
      if (savedData) {
        try {
          savedFoods = JSON.parse(savedData);
        } catch (e) {
          console.error('Error parsing saved data:', e);
        }
      }
      
      // Cari makanan yang akan dihapus
      const foodIndex = savedFoods.findIndex(item => item.name === foodName);
      
      // Jika makanan ditemukan (baik default maupun custom)
      if (foodIndex !== -1) {
        // Jika makanan default, tandai sebagai dihapus
        if (savedFoods[foodIndex].isDefault) {
          savedFoods[foodIndex].isDeleted = true;
        } else {
          // Jika makanan custom, hapus dari array
          savedFoods.splice(foodIndex, 1);
        }
      } else {
        // Jika makanan default tidak ada di savedFoods (belum pernah disimpan)
        const defaultFood = this.defaultFoods.find(item => item.name === foodName);
        if (defaultFood) {
          savedFoods.push({...defaultFood, isDeleted: true});
        }
      }
      
      // Simpan kembali ke localStorage
      localStorage.setItem('foodItems', JSON.stringify(savedFoods));
      alert(`"${foodName}" berhasil dihapus secara permanen`);
    }
  }

  // Method untuk membuat tombol makanan baru
  createFoodButton(name, price, imageSrc = '') {
    const newButton = document.createElement("button");
    newButton.className = "food-btn";
    newButton.setAttribute("data-value", price);
    newButton.setAttribute("aria-label", `${name} Rp ${price}`);

    // Handle gambar
    if (imageSrc) {
      const img = document.createElement("img");
      img.src = imageSrc;
      img.alt = name;
      img.className = "food-img";
      newButton.appendChild(img);
    } else {
      const icon = document.createElement("i");
      icon.className = "fas fa-utensils food-icon";
      newButton.appendChild(icon);
    }

    // Tambahkan elemen harga dan nama
    const priceBadge = document.createElement("span");
    priceBadge.className = "food-price";
    priceBadge.textContent = `Rp ${Math.round(price / 1000)}k`;
    newButton.appendChild(priceBadge);

    const nameSpan = document.createElement("span");
    nameSpan.className = "food-name";
    nameSpan.textContent = name;
    newButton.appendChild(nameSpan);

    // Tambahkan ke container
    const buttonsContainer = document.querySelector(".buttons");
    const firstNonFoodButton = buttonsContainer.querySelector("button:not([data-value])");
    if (firstNonFoodButton) {
      buttonsContainer.insertBefore(newButton, firstNonFoodButton);
    } else {
      buttonsContainer.appendChild(newButton);
    }

    // Tambahkan event listener
    newButton.addEventListener("click", () => {
      const value = newButton.getAttribute("data-value");
      this.handleInput(value, newButton);
    });
    
    return newButton;
  }

  // Method untuk menyimpan semua makanan ke localStorage
  saveFoodItems() {
    const allFoodItems = [];
    
    // 1. Tambahkan semua makanan default (termasuk yang dihapus)
    this.defaultFoods.forEach(item => {
      allFoodItems.push({...item});
    });
    
    // 2. Tambahkan makanan custom dari DOM
    document.querySelectorAll('button[data-value]').forEach(button => {
      const name = button.querySelector('.food-name').textContent;
      const isDefault = this.defaultFoods.some(df => df.name === name);
      
      // Jika bukan makanan default, tambahkan sebagai custom
      if (!isDefault) {
        allFoodItems.push({
          name: name,
          price: button.getAttribute('data-value'),
          imageSrc: button.querySelector('img')?.src || '',
          isDefault: false,
          isDeleted: false
        });
      }
    });
    
    // 3. Simpan ke localStorage
    localStorage.setItem('foodItems', JSON.stringify(allFoodItems));
  }

  // Method untuk memuat makanan dari localStorage
  loadFoodItems() {
    // Hapus semua tombol makanan yang ada
    document.querySelectorAll('button[data-value]').forEach(btn => btn.remove());
    
    const savedData = localStorage.getItem('foodItems');
    let foodsToLoad = [];
    
    if (savedData) {
      try {
        const savedFoods = JSON.parse(savedData);
        
        // Filter hanya yang tidak dihapus
        foodsToLoad = savedFoods.filter(food => !food.isDeleted);
        
        // Update status isDeleted untuk default foods
        this.defaultFoods.forEach(df => {
          const savedFood = savedFoods.find(sf => sf.name === df.name);
          if (savedFood) {
            df.isDeleted = savedFood.isDeleted;
          }
        });
      } catch (e) {
        console.error('Error parsing saved data:', e);
        // Jika error, muat default foods yang tidak dihapus
        foodsToLoad = this.defaultFoods.filter(food => !food.isDeleted);
      }
    } else {
      // Jika tidak ada data, muat semua default foods
      foodsToLoad = this.defaultFoods.filter(food => !food.isDeleted);
    }
    
    // Buat tombol untuk setiap makanan
    foodsToLoad.forEach(food => {
      this.createFoodButton(food.name, food.price, food.imageSrc);
    });
  }

  // Method untuk inisialisasi tombol tambah makanan
  initializeFoodButton() {
    document.getElementById("add-food-btn").addEventListener("click", () => {
      document.getElementById("food-modal").style.display = "block";
      setTimeout(() => document.getElementById("food-name").focus(), 100);
    });

    document.getElementById("cancel-food").addEventListener("click", () => {
      document.getElementById("food-name").value = "";
      document.getElementById("food-price").value = "";
      document.getElementById("food-image").value = "";
      document.getElementById("food-modal").style.display = "none";
    });

    document.getElementById("save-food").addEventListener("click", () => {
      this.addNewFoodButton();
    });

    const foodPriceInput = document.getElementById("food-price");
    foodPriceInput.addEventListener("keydown", function (e) {
      if (
        e.key !== "Backspace" &&
        e.key !== "Delete" &&
        e.key !== "ArrowLeft" &&
        e.key !== "ArrowRight" &&
        e.key !== "Tab" &&
        (e.key < "0" || e.key > "9")
      ) {
        e.preventDefault();
      }
    });
  }

  // Method untuk menambahkan tombol makanan baru
  addNewFoodButton() {
    try {
      const name = document.getElementById("food-name").value.trim();
      const price = document.getElementById("food-price").value.trim();
      const fileInput = document.getElementById("food-image");
      
      if (!name || !price) throw new Error("Nama dan harga harus diisi!");
      if (isNaN(price)) throw new Error("Harga harus berupa angka");

      const priceNumber = parseInt(price);
      if (priceNumber <= 0) throw new Error("Harga harus lebih besar dari 0");

      // Cek apakah nama makanan sudah ada
      const existingButtons = Array.from(document.querySelectorAll('button[data-value]'))
        .map(button => button.querySelector('.food-name').textContent);
      
      if (existingButtons.includes(name)) {
        throw new Error("Makanan dengan nama tersebut sudah ada!");
      }

      if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.createFoodButton(name, priceNumber, e.target.result);
          this.saveFoodItems();
          this.finishAddingFood();
        };
        reader.readAsDataURL(fileInput.files[0]);
      } else {
        this.createFoodButton(name, priceNumber);
        this.saveFoodItems();
        this.finishAddingFood();
      }
    } catch (error) {
      alert(error.message);
    }
  }

  // Method untuk menyelesaikan proses penambahan makanan
  finishAddingFood() {
    document.getElementById("food-name").value = "";
    document.getElementById("food-price").value = "";
    document.getElementById("food-image").value = "";
    document.getElementById("food-modal").style.display = "none";
    alert("Makanan baru berhasil ditambahkan!");
  }

  initialize() {
    document.querySelectorAll(".buttons button").forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.getAttribute("data-value") || button.textContent.trim();
        this.handleInput(value, button);
      });
    });

    document.addEventListener("keydown", (e) => {
      const activeElement = document.activeElement;
      const isInputField = activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA";
      if (e.key === "Backspace" && !isInputField) {
        e.preventDefault();
        this.backspace();
      }
    });
  }

  initializeMenu() {
    const menuBtn = document.createElement("button");
    menuBtn.id = "toggle-menu";
    menuBtn.className = "menu-btn";
    menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    document.querySelector(".calculator").appendChild(menuBtn);

    menuBtn.addEventListener("click", () => {
      document.querySelector(".sidebar-menu").classList.toggle("active");
    });

    document.getElementById("close-menu").addEventListener("click", () => {
      document.querySelector(".sidebar-menu").classList.remove("active");
    });

    document.getElementById("clear-history").addEventListener("click", () => {
      this.historyList = [];
      this.updateHistoryDisplay();
      localStorage.removeItem("foodCalculatorHistory");
    });

    const currentYear = new Date().getFullYear();
    const yearSelect = document.getElementById("report-year");
    yearSelect.innerHTML = "";
    for (let year = currentYear; year >= currentYear - 2; year--) {
      yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
    }

    const currentMonth = new Date().getMonth() + 1;
    document.getElementById("report-month").value = currentMonth;

    document.getElementById("export-history").addEventListener("click", () => {
      const month = document.getElementById("report-month").value;
      const year = document.getElementById("report-year").value;
      this.generateMonthlyReport(month, year);
    });
  }

  loadHistory() {
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
      const monthlyData = this.historyList.filter((item) => {
        const date = new Date(item.timestamp);
        return date.getMonth() + 1 == month && date.getFullYear() == year;
      });

      if (monthlyData.length === 0) {
        alert(`Tidak ada data transaksi untuk bulan ${month}-${year}`);
        return;
      }

      const wb = XLSX.utils.book_new();

      const wsData = [
        ["No", "Tanggal", "Items", "Total (Rp)", "Detail Transaksi"],
        ...monthlyData.map((item, index) => [
          index + 1,
          XLSX.SSF.format("dd-mm-yyyy", new Date(item.timestamp)),
          item.items.join(", "),
          Number(item.total.replace(/[^\d]/g, "")),
          item.expression,
        ]),
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws["!cols"] = [
        { wch: 5 },
        { wch: 12 },
        { wch: 30 },
        { wch: 15 },
        { wch: 50 },
      ];

      for (let i = 1; i < wsData.length; i++) {
        const cellRef = XLSX.utils.encode_cell({ r: i, c: 3 });
        if (!ws[cellRef]) ws[cellRef] = {};
        ws[cellRef].z = '"Rp"#,##0;[Red]"Rp"-#,##0';
      }

      XLSX.utils.book_append_sheet(wb, ws, `Laporan ${month}-${year}`);

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
    this.updateDisplay();
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
