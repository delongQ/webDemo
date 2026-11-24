(function () {
  const COLS = 10;
  const ROWS = 20;
  const CELL = 12;
  const TYPES = ["I", "O", "T", "S", "Z", "J", "L"];
  const SHAPES = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]],
  };
  const COLORS = {
    I: "#3d9a9a",
    O: "#e0b033",
    T: "#8b6bb8",
    S: "#5ea36a",
    Z: "#d46a3a",
    J: "#4f74a8",
    L: "#d08a45",
  };

  const box = document.getElementById("tetris-box");
  const openBtn = document.getElementById("tetris-open");
  const canvas = document.getElementById("tetris-board");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("tetris-score");
  const startBtn = document.getElementById("tetris-start");

  let board = blank();
  let piece = null;
  let score = 0;
  let playing = false;
  let over = false;
  let raf = 0;
  let last = 0;
  let acc = 0;

  function blank() {
    return Array.from({ length: ROWS }, function () {
      return Array(COLS).fill(null);
    });
  }

  function rotate(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const next = Array.from({ length: cols }, function () {
      return Array(rows).fill(0);
    });
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) next[c][rows - 1 - r] = matrix[r][c];
    }
    return next;
  }

  function fits(shape, x, y) {
    for (let r = 0; r < shape.length; r += 1) {
      for (let c = 0; c < shape[r].length; c += 1) {
        if (!shape[r][c]) continue;
        const nx = x + c;
        const ny = y + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
        if (ny >= 0 && board[ny][nx]) return false;
      }
    }
    return true;
  }

  function spawn() {
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    const shape = SHAPES[type].map(function (row) { return row.slice(); });
    piece = {
      type: type,
      shape: shape,
      x: Math.floor((COLS - shape[0].length) / 2),
      y: 0,
    };
    if (!fits(shape, piece.x, piece.y)) finish();
  }

  function finish() {
    playing = false;
    piece = null;
    over = true;
    startBtn.textContent = "再来";
  }

  function paint(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
  }

  function draw() {
    ctx.fillStyle = "#1c1915";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (board[y][x]) paint(x, y, COLORS[board[y][x]]);
      }
    }
    if (piece) {
      piece.shape.forEach(function (row, r) {
        row.forEach(function (filled, c) {
          if (filled && piece.y + r >= 0) paint(piece.x + c, piece.y + r, COLORS[piece.type]);
        });
      });
    }
    if (over) {
      ctx.fillStyle = "rgba(28, 25, 21, 0.55)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#f6f1e7";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("结束", canvas.width / 2, canvas.height / 2);
    }
  }

  function lock() {
    const shape = piece.shape;
    for (let r = 0; r < shape.length; r += 1) {
      for (let c = 0; c < shape[r].length; c += 1) {
        if (!shape[r][c]) continue;
        const y = piece.y + r;
        if (y < 0) {
          finish();
          return;
        }
        board[y][piece.x + c] = piece.type;
      }
    }
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y -= 1) {
      if (board[y].every(Boolean)) {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(null));
        cleared += 1;
        y += 1;
      }
    }
    score += 1 + [0, 100, 300, 500, 800][cleared];
    scoreEl.textContent = String(score);
    spawn();
  }

  function down() {
    if (!playing || !piece) return;
    if (fits(piece.shape, piece.x, piece.y + 1)) piece.y += 1;
    else lock();
    draw();
  }

  function move(dir) {
    if (!playing || !piece) return;
    if (!fits(piece.shape, piece.x + dir, piece.y)) return;
    piece.x += dir;
    draw();
  }

  function turn() {
    if (!playing || !piece) return;
    const shape = rotate(piece.shape);
    const kicks = [0, -1, 1];
    for (let i = 0; i < kicks.length; i += 1) {
      if (fits(shape, piece.x + kicks[i], piece.y)) {
        piece.shape = shape;
        piece.x += kicks[i];
        draw();
        return;
      }
    }
  }

  function drop() {
    if (!playing || !piece) return;
    while (fits(piece.shape, piece.x, piece.y + 1)) piece.y += 1;
    lock();
    draw();
  }

  function frame(now) {
    if (!playing) {
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(frame);
    acc += Math.min(80, now - last);
    last = now;
    while (acc >= 700 && playing) {
      acc -= 700;
      down();
    }
  }

  function start() {
    board = blank();
    piece = null;
    score = 0;
    over = false;
    playing = true;
    scoreEl.textContent = "0";
    startBtn.textContent = "重开";
    spawn();
    draw();
    last = performance.now();
    acc = 0;
    if (!raf) raf = requestAnimationFrame(frame);
    box.focus();
  }

  startBtn.addEventListener("click", start);
  box.addEventListener("click", function (event) {
    const button = event.target.closest("[data-act]");
    if (!button) return;
    if (button.dataset.act === "left") move(-1);
    else if (button.dataset.act === "right") move(1);
    else if (button.dataset.act === "rot") turn();
    else if (button.dataset.act === "drop") drop();
  });
  document.getElementById("tetris-close").addEventListener("click", function () {
    playing = false;
    box.hidden = true;
    openBtn.hidden = false;
  });
  openBtn.addEventListener("click", function () {
    openBtn.hidden = true;
    box.hidden = false;
  });
  document.addEventListener("keydown", function (event) {
    if (box.hidden || !box.contains(document.activeElement)) return;
    const key = event.key;
    if (key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    } else if (key === "ArrowRight") {
      event.preventDefault();
      move(1);
    } else if (key === "ArrowUp") {
      if (event.repeat) return;
      event.preventDefault();
      turn();
    } else if (key === "ArrowDown") {
      event.preventDefault();
      down();
    } else if (key === " ") {
      if (event.repeat) return;
      event.preventDefault();
      drop();
    }
  });

  draw();
})();
