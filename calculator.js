(function () {
  const displayEl = document.getElementById("display");
  const expressionEl = document.getElementById("expression");
  const calculatorEl = document.getElementById("calculator");

  const state = {
    display: "0",
    stored: null,
    operator: null,
    waiting: false,
    error: false,
  };

  function format(value) {
    if (!Number.isFinite(value)) return "错误";
    const rounded = Math.round((value + Number.EPSILON) * 1e10) / 1e10;
    let text = String(rounded);
    if (text.replace("-", "").replace(".", "").length > 12) {
      text = rounded.toExponential(6).replace(/\.?0+e/, "e");
    }
    return text;
  }

  function currentNumber() {
    return Number(state.display);
  }

  function render() {
    displayEl.textContent = state.display;
    expressionEl.textContent = state.operator && state.stored !== null
      ? state.stored + " " + state.operator
      : "\u00a0";
    calculatorEl.querySelectorAll("[data-operator]").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.operator === state.operator && state.waiting);
    });
  }

  function clearAll() {
    state.display = "0";
    state.stored = null;
    state.operator = null;
    state.waiting = false;
    state.error = false;
    render();
  }

  function inputDigit(digit) {
    if (state.error) clearAll();
    if (state.waiting) {
      state.display = digit;
      state.waiting = false;
    } else if (state.display === "0") {
      state.display = digit;
    } else if (state.display.replace("-", "").replace(".", "").length < 12) {
      state.display += digit;
    }
    render();
  }

  function inputDecimal() {
    if (state.error) clearAll();
    if (state.waiting) {
      state.display = "0.";
      state.waiting = false;
    } else if (!state.display.includes(".")) {
      state.display += ".";
    }
    render();
  }

  function toggleSign() {
    if (state.error || state.display === "0") return;
    state.display = state.display.startsWith("-")
      ? state.display.slice(1)
      : "-" + state.display;
    render();
  }

  function percent() {
    if (state.error) return;
    state.display = format(currentNumber() / 100);
    render();
  }

  function backspace() {
    if (state.error || state.waiting) return;
    if (state.display.length <= 1 || (state.display.length === 2 && state.display.startsWith("-"))) {
      state.display = "0";
    } else {
      state.display = state.display.slice(0, -1);
    }
    render();
  }

  function compute(left, operator, right) {
    if (operator === "+") return left + right;
    if (operator === "−") return left - right;
    if (operator === "×") return left * right;
    if (operator === "÷") {
      if (right === 0) return NaN;
      return left / right;
    }
    return right;
  }

  function setOperator(operator) {
    if (state.error) return;
    const value = currentNumber();
    if (state.operator && !state.waiting && state.stored !== null) {
      const result = compute(state.stored, state.operator, value);
      if (!Number.isFinite(result)) {
        state.display = "不能除以 0";
        state.error = true;
        state.operator = null;
        state.stored = null;
        state.waiting = false;
        render();
        return;
      }
      state.display = format(result);
      state.stored = result;
    } else {
      state.stored = value;
    }
    state.operator = operator;
    state.waiting = true;
    render();
  }

  function equals() {
    if (state.error || !state.operator || state.stored === null) return;
    const result = compute(state.stored, state.operator, currentNumber());
    expressionEl.textContent = state.stored + " " + state.operator + " " + state.display + " =";
    if (!Number.isFinite(result)) {
      state.display = "不能除以 0";
      state.error = true;
    } else {
      state.display = format(result);
    }
    state.stored = null;
    state.operator = null;
    state.waiting = true;
    displayEl.textContent = state.display;
    calculatorEl.querySelectorAll("[data-operator]").forEach(function (button) {
      button.classList.remove("is-active");
    });
  }

  calculatorEl.addEventListener("click", function (event) {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.digit) inputDigit(button.dataset.digit);
    else if (button.dataset.operator) setOperator(button.dataset.operator);
    else if (button.dataset.action === "decimal") inputDecimal();
    else if (button.dataset.action === "clear") clearAll();
    else if (button.dataset.action === "backspace") backspace();
    else if (button.dataset.action === "percent") percent();
    else if (button.dataset.action === "sign") toggleSign();
    else if (button.dataset.action === "equals") equals();
  });

  document.addEventListener("keydown", function (event) {
    const key = event.key;
    if (key >= "0" && key <= "9") inputDigit(key);
    else if (key === ".") inputDecimal();
    else if (key === "+") setOperator("+");
    else if (key === "-") setOperator("−");
    else if (key === "*") setOperator("×");
    else if (key === "/") {
      event.preventDefault();
      setOperator("÷");
    } else if (key === "Enter" || key === "=") {
      event.preventDefault();
      equals();
    } else if (key === "Escape") clearAll();
    else if (key === "Backspace") backspace();
    else if (key === "%") percent();
  });

  render();
})();
