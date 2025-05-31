class FoodPriceCalculator {
    constructor() {
        this.currentInput = '0';
        this.display = document.getElementById('result');
        this.expression = ''; // Untuk perhitungan matematika
        this.history = [];    // Untuk tampilan riwayat
        this.initialize();
        this.setupDisplayScroll();
    }

    initialize() {
        document.querySelectorAll('.buttons button').forEach(button => {
            button.addEventListener('click', () => {
                const value = button.getAttribute('data-value') || button.textContent.trim();
                this.handleInput(value, button);
            });
        });

        // Tambahkan event listener untuk keyboard backspace
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
                e.preventDefault();
                this.backspace();
            }
        });
    }

    setupDisplayScroll() {
        this.display.style.overflowX = 'auto';
        this.display.style.overflowY = 'hidden';
        this.display.style.whiteSpace = 'nowrap';
        this.display.style.wordWrap = 'normal';
    }

    handleInput(value, button = null) {
        if (value === 'C') {
            this.clearAll();
        } else if (value === '⌫') {
            this.backspace();
        } else if (value === '=') {
            this.calculate();
        } else if (['+', '×'].includes(value)) {
            this.addToExpression(value);
        } else if (value.match(/^\d+$/)) {
            this.appendNumber(value);
        } else if (value.match(/Rp \d+k/)) {
            const numericValue = value.match(/\d+/)[0];
            this.addFoodPrice(parseInt(numericValue) * 1000, button);
        } else if (button && button.getAttribute('data-value')) {
            this.addFoodPrice(parseInt(button.getAttribute('data-value')), button);
        }
        
        this.updateDisplay();
        this.display.scrollLeft = this.display.scrollWidth;
    }

    appendNumber(number) {
        if (this.currentInput === '0') {
            this.currentInput = number;
        } else {
            this.currentInput += number;
        }
    }

    addFoodPrice(price, button) {
        this.currentInput = price.toString();
        this.expression = price.toString();
        
        if (button) {
            const foodName = button.getAttribute('aria-label').split(' Rp')[0];
            this.history.push(`${foodName}(${this.formatCurrency(price)})`);
        } else {
            this.history.push(this.formatCurrency(price));
        }
    }

    addToExpression(operator) {
        if (this.currentInput !== '0') {
            this.expression += this.currentInput + ' ' + operator + ' ';
            this.history.push(this.currentInput, operator);
            this.currentInput = '0';
        } else if (this.expression.endsWith('+ ') || this.expression.endsWith('× ')) {
            this.expression = this.expression.slice(0, -2) + operator + ' ';
            this.history[this.history.length - 1] = operator;
        }
    }

    calculate() {
        if (this.currentInput !== '0') {
            this.expression += this.currentInput;
            this.history.push(this.currentInput);
        }
        
        let cleanExpression = this.expression.replace(/Rp\s?\d+(\.\d{3})*(,\d+)?/g, match => {
            return match.replace(/[^\d]/g, '');
        }).replace(/×/g, '*');
        
        try {
            const result = new Function('return ' + cleanExpression)();
            this.currentInput = result.toString();
            this.expression = this.history.join(' ') + ' = ' + this.formatCurrency(result);
            this.history = [];
        } catch (error) {
            this.currentInput = 'Error';
            this.expression = '';
            this.history = [];
        }
    }

    backspace() {
        if (this.currentInput.length > 1) {
            this.currentInput = this.currentInput.slice(0, -1);
        } else {
            this.currentInput = '0';
        }
        this.updateDisplay();
    }

    clearAll() {
        this.currentInput = '0';
        this.expression = '';
        this.history = [];
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value || 0).replace('IDR', 'Rp');
    }

    updateDisplay() {
        let displayText;
        
        if (this.expression.includes('=')) {
            displayText = this.expression.replace(' = ', '<br>= ');
        } else if (this.history.length > 0) {
            displayText = this.history.join(' ') + 
                        (this.currentInput !== '0' ? ' ' + this.currentInput : '');
        } else {
            displayText = this.formatCurrency(parseFloat(this.currentInput));
        }
        
        this.display.innerHTML = displayText;
        
        if (this.display.scrollWidth > this.display.clientWidth) {
            this.display.style.whiteSpace = 'normal';
            this.display.style.overflowY = 'auto';
        } else {
            this.display.style.whiteSpace = 'nowrap';
            this.display.style.overflowY = 'hidden';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FoodPriceCalculator();
});