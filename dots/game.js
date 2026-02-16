document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 600;
  canvas.height = 600;

  const config = {
    gridSize: 5,
    dotRadius: 6,
    padding: 60,
    colors: {
      background: "#282a36",
      currentLine: "#44475a",
      foreground: "#f8f8f2",
      comment: "#6272a4",
      cyan: "#8be9fd",
      green: "#50fa7b",
      orange: "#ffb86c",
      pink: "#ff79c6",
      purple: "#bd93f9",
      red: "#ff5555",
      yellow: "#f1fa8c",
    },
  };

  const ANIM_LINE_DURATION = 180;
  const ANIM_BOX_DURATION = 300;

  let cellSize;
  let hoveredLine = null;
  let hLines, vLines, boxes;
  let currentPlayer = 1;
  let gameOver = false;
  let aiMode = false;
  let aiThinking = false;
  let animations = []; // { type, row, col, direction?, player, time }
  let animFrameId = null;
  let lastS1 = 0, lastS2 = 0;
  let confetti = [];
  let confettiAnimId = null;
  const playerColors = { 1: config.colors.cyan, 2: config.colors.pink };

  function initGame(size) {
    config.gridSize = size;
    cellSize = (canvas.width - 2 * config.padding) / (config.gridSize - 1);
    hLines = Array.from({ length: config.gridSize }, () => Array(config.gridSize - 1).fill(0));
    vLines = Array.from({ length: config.gridSize - 1 }, () => Array(config.gridSize).fill(0));
    boxes = Array.from({ length: config.gridSize - 1 }, () => Array(config.gridSize - 1).fill(0));
    currentPlayer = 1;
    gameOver = false;
    hoveredLine = null;
    canvas.style.cursor = "default";
    aiThinking = false;
    animations = [];
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    confetti = [];
    if (confettiAnimId) { cancelAnimationFrame(confettiAnimId); confettiAnimId = null; }
    lastS1 = 0;
    lastS2 = 0;
  }

  initGame(config.gridSize);

  function scheduleAnim(anim) {
    animations.push(anim);
    if (!animFrameId) {
      animFrameId = requestAnimationFrame(animLoop);
    }
  }

  function animLoop() {
    const now = performance.now();
    drawBoard(now);
    // Remove finished animations
    animations = animations.filter((a) => {
      const dur = a.type === "line" ? ANIM_LINE_DURATION : ANIM_BOX_DURATION;
      return now - a.time < dur;
    });
    if (animations.length > 0) {
      animFrameId = requestAnimationFrame(animLoop);
    } else {
      animFrameId = null;
    }
  }

  function getDotPos(row, col) {
    return {
      x: config.padding + col * cellSize,
      y: config.padding + row * cellSize,
    };
  }

  function isLinePlaced(row, col, direction) {
    return direction === "h" ? hLines[row][col] : vLines[row][col];
  }

  function placeLine(row, col, direction) {
    if (direction === "h") {
      hLines[row][col] = currentPlayer;
    } else {
      vLines[row][col] = currentPlayer;
    }
    scheduleAnim({ type: "line", row, col, direction, player: currentPlayer, time: performance.now() });
  }

  function checkBoxes() {
    let completed = 0;
    for (let row = 0; row < config.gridSize - 1; row++) {
      for (let col = 0; col < config.gridSize - 1; col++) {
        if (boxes[row][col]) continue;
        const top = hLines[row][col];
        const bottom = hLines[row + 1][col];
        const left = vLines[row][col];
        const right = vLines[row][col + 1];
        if (top && bottom && left && right) {
          boxes[row][col] = currentPlayer;
          completed++;
          scheduleAnim({ type: "box", row, col, player: currentPlayer, time: performance.now() });
        }
      }
    }
    return completed;
  }

  function getLineFromMouse(mouseX, mouseY) {
    const gx = (mouseX - config.padding) / cellSize;
    const gy = (mouseY - config.padding) / cellSize;

    const candidates = [];

    // Horizontal line candidate: row is nearest integer, col is fractional
    const hRow = Math.round(gy);
    const hCol = Math.floor(gx);
    if (hRow >= 0 && hRow < config.gridSize && hCol >= 0 && hCol < config.gridSize - 1) {
      const frac = gx - hCol;
      if (frac > 0.2 && frac < 0.8) {
        const midX = config.padding + (hCol + 0.5) * cellSize;
        const midY = config.padding + hRow * cellSize;
        const dist = Math.hypot(mouseX - midX, mouseY - midY);
        candidates.push({ row: hRow, col: hCol, direction: "h", dist });
      }
    }

    // Vertical line candidate: col is nearest integer, row is fractional
    const vCol = Math.round(gx);
    const vRow = Math.floor(gy);
    if (vCol >= 0 && vCol < config.gridSize && vRow >= 0 && vRow < config.gridSize - 1) {
      const frac = gy - vRow;
      if (frac > 0.2 && frac < 0.8) {
        const midX = config.padding + vCol * cellSize;
        const midY = config.padding + (vRow + 0.5) * cellSize;
        const dist = Math.hypot(mouseX - midX, mouseY - midY);
        candidates.push({ row: vRow, col: vCol, direction: "v", dist });
      }
    }

    if (candidates.length === 0) return null;

    const best = candidates.reduce((a, b) => (a.dist < b.dist ? a : b));
    const threshold = cellSize * 0.4;
    return best.dist <= threshold ? { row: best.row, col: best.col, direction: best.direction } : null;
  }

  function updateTurnIndicator() {
    const el = document.getElementById("turn-indicator");
    el.classList.remove("game-over");
    const name = (aiMode && currentPlayer === 2) ? "AI" : `Player ${currentPlayer}`;
    el.textContent = `${name}'s turn`;
    el.style.color = playerColors[currentPlayer];
  }

  function spawnConfetti(winnerColor) {
    confetti = [];
    const colors = [
      winnerColor,
      config.colors.purple,
      config.colors.green,
      config.colors.yellow,
      config.colors.orange,
      config.colors.pink,
      config.colors.cyan,
    ];
    for (let i = 0; i < 80; i++) {
      confetti.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 100,
        y: canvas.height / 2 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 4,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        life: 1,
      });
    }
    confettiAnimId = requestAnimationFrame(confettiLoop);
  }

  function confettiLoop() {
    drawBoard();
    let alive = false;
    for (const p of confetti) {
      if (p.life <= 0) continue;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // gravity
      p.rotation += p.rotSpeed;
      p.life -= 0.008;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    ctx.globalAlpha = 1.0;
    if (alive) {
      confettiAnimId = requestAnimationFrame(confettiLoop);
    } else {
      confettiAnimId = null;
      confetti = [];
    }
  }

  function checkGameOver() {
    const total = (config.gridSize - 1) * (config.gridSize - 1);
    let s1 = 0, s2 = 0;
    for (let row = 0; row < config.gridSize - 1; row++) {
      for (let col = 0; col < config.gridSize - 1; col++) {
        if (boxes[row][col] === 1) s1++;
        else if (boxes[row][col] === 2) s2++;
      }
    }
    if (s1 + s2 < total) return;

    gameOver = true;
    hoveredLine = null;
    canvas.style.cursor = "default";
    const el = document.getElementById("turn-indicator");
    el.classList.add("game-over");
    if (s1 > s2) {
      el.textContent = "Player 1 wins!";
      el.style.color = playerColors[1];
      spawnConfetti(playerColors[1]);
    } else if (s2 > s1) {
      el.textContent = (aiMode ? "AI" : "Player 2") + " wins!";
      el.style.color = playerColors[2];
      spawnConfetti(playerColors[2]);
    } else {
      el.textContent = "It's a draw!";
      el.style.color = config.colors.foreground;
      spawnConfetti(config.colors.purple);
    }
  }

  function getAllAvailableLines() {
    const lines = [];
    for (let row = 0; row < config.gridSize; row++)
      for (let col = 0; col < config.gridSize - 1; col++)
        if (!hLines[row][col]) lines.push({ row, col, direction: "h" });
    for (let row = 0; row < config.gridSize - 1; row++)
      for (let col = 0; col < config.gridSize; col++)
        if (!vLines[row][col]) lines.push({ row, col, direction: "v" });
    return lines;
  }

  function countSidesForBox(row, col) {
    let count = 0;
    if (hLines[row][col]) count++;
    if (hLines[row + 1][col]) count++;
    if (vLines[row][col]) count++;
    if (vLines[row][col + 1]) count++;
    return count;
  }

  function getAdjacentBoxes(line) {
    const result = [];
    const { row, col, direction } = line;
    if (direction === "h") {
      // box above: (row-1, col)
      if (row > 0 && !boxes[row - 1][col]) result.push({ row: row - 1, col });
      // box below: (row, col)
      if (row < config.gridSize - 1 && !boxes[row][col]) result.push({ row, col });
    } else {
      // box left: (row, col-1)
      if (col > 0 && !boxes[row][col - 1]) result.push({ row, col: col - 1 });
      // box right: (row, col)
      if (col < config.gridSize - 1 && !boxes[row][col]) result.push({ row, col });
    }
    return result;
  }

  function aiChooseMove() {
    const available = getAllAvailableLines();
    if (available.length === 0) return null;

    // Priority 1: complete a box (any adjacent box has 3 sides)
    const completing = available.filter((line) =>
      getAdjacentBoxes(line).some((b) => countSidesForBox(b.row, b.col) === 3)
    );
    if (completing.length > 0) return completing[0];

    // Priority 2: safe moves that don't give opponent a box
    // (no adjacent box would reach 3 sides after placing this line)
    const safe = available.filter((line) =>
      getAdjacentBoxes(line).every((b) => countSidesForBox(b.row, b.col) < 2)
    );
    if (safe.length > 0) return safe[Math.floor(Math.random() * safe.length)];

    // Priority 3: least harmful — pick the line whose adjacent boxes have the fewest sides
    // (prefer giving away fewer boxes / smaller chains)
    const scored = available.map((line) => {
      const maxSides = getAdjacentBoxes(line).reduce(
        (max, b) => Math.max(max, countSidesForBox(b.row, b.col)), 0
      );
      return { line, maxSides };
    });
    scored.sort((a, b) => a.maxSides - b.maxSides);
    return scored[0].line;
  }

  function doAiTurn() {
    if (gameOver || !aiMode || currentPlayer !== 2) {
      aiThinking = false;
      return;
    }
    aiThinking = true;

    setTimeout(() => {
      if (gameOver || !aiMode || currentPlayer !== 2) {
        aiThinking = false;
        return;
      }

      const move = aiChooseMove();
      if (!move) { aiThinking = false; return; }

      placeLine(move.row, move.col, move.direction);
      const completed = checkBoxes();
      if (completed === 0) {
        currentPlayer = 1;
      }
      updateTurnIndicator();
      updateScores();
      checkGameOver();
      drawBoard();

      // If AI completed a box, it gets another turn
      if (!gameOver && currentPlayer === 2) {
        doAiTurn();
      } else {
        aiThinking = false;
      }
    }, 300);
  }

  function updateScores() {
    let s1 = 0, s2 = 0;
    for (let row = 0; row < config.gridSize - 1; row++) {
      for (let col = 0; col < config.gridSize - 1; col++) {
        if (boxes[row][col] === 1) s1++;
        else if (boxes[row][col] === 2) s2++;
      }
    }
    const el = document.getElementById("scores");
    el.innerHTML =
      `<span style="color:${playerColors[1]}">P1: ${s1}</span> — <span style="color:${playerColors[2]}">${aiMode ? "AI" : "P2"}: ${s2}</span>`;
    if (s1 !== lastS1 || s2 !== lastS2) {
      el.classList.remove("pop");
      void el.offsetWidth; // force reflow to restart animation
      el.classList.add("pop");
      setTimeout(() => el.classList.remove("pop"), 150);
    }
    lastS1 = s1;
    lastS2 = s2;
  }

  function getLineAnim(row, col, direction, now) {
    for (let i = animations.length - 1; i >= 0; i--) {
      const a = animations[i];
      if (a.type === "line" && a.row === row && a.col === col && a.direction === direction) {
        return Math.min((now - a.time) / ANIM_LINE_DURATION, 1);
      }
    }
    return 1;
  }

  function getBoxAnim(row, col, now) {
    for (let i = animations.length - 1; i >= 0; i--) {
      const a = animations[i];
      if (a.type === "box" && a.row === row && a.col === col) {
        return Math.min((now - a.time) / ANIM_BOX_DURATION, 1);
      }
    }
    return 1;
  }

  // Ease-out cubic for smooth deceleration
  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function drawLine(start, end, progress) {
    if (progress >= 1) {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    } else {
      const p = easeOut(progress);
      const mx = (start.x + end.x) / 2;
      const my = (start.y + end.y) / 2;
      const dx = (end.x - start.x) / 2 * p;
      const dy = (end.y - start.y) / 2 * p;
      ctx.beginPath();
      ctx.moveTo(mx - dx, my - dy);
      ctx.lineTo(mx + dx, my + dy);
      ctx.stroke();
    }
  }

  function drawBoard(now) {
    now = now || performance.now();
    ctx.fillStyle = config.colors.currentLine;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw claimed boxes
    for (let row = 0; row < config.gridSize - 1; row++) {
      for (let col = 0; col < config.gridSize - 1; col++) {
        if (boxes[row][col]) {
          const topLeft = getDotPos(row, col);
          const progress = easeOut(getBoxAnim(row, col, now));
          ctx.fillStyle = playerColors[boxes[row][col]];
          ctx.globalAlpha = 0.3 * progress;
          ctx.fillRect(topLeft.x, topLeft.y, cellSize, cellSize);
          ctx.globalAlpha = 1.0;
        }
      }
    }

    // Draw placed lines
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for (let row = 0; row < config.gridSize; row++) {
      for (let col = 0; col < config.gridSize - 1; col++) {
        if (hLines[row][col]) {
          ctx.strokeStyle = playerColors[hLines[row][col]];
          const start = getDotPos(row, col);
          const end = getDotPos(row, col + 1);
          drawLine(start, end, getLineAnim(row, col, "h", now));
        }
      }
    }
    for (let row = 0; row < config.gridSize - 1; row++) {
      for (let col = 0; col < config.gridSize; col++) {
        if (vLines[row][col]) {
          ctx.strokeStyle = playerColors[vLines[row][col]];
          const start = getDotPos(row, col);
          const end = getDotPos(row + 1, col);
          drawLine(start, end, getLineAnim(row, col, "v", now));
        }
      }
    }

    // Draw hover highlight before dots so dots stay on top
    if (hoveredLine) {
      const { row, col, direction } = hoveredLine;
      let start, end;
      if (direction === "h") {
        start = getDotPos(row, col);
        end = getDotPos(row, col + 1);
      } else {
        start = getDotPos(row, col);
        end = getDotPos(row + 1, col);
      }
      ctx.strokeStyle = playerColors[currentPlayer];
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    // Draw dots with glow for hovered line endpoints
    for (let row = 0; row < config.gridSize; row++) {
      for (let col = 0; col < config.gridSize; col++) {
        const { x, y } = getDotPos(row, col);
        let isEndpoint = false;
        if (hoveredLine) {
          const h = hoveredLine;
          if (h.direction === "h" && h.row === row && (h.col === col || h.col + 1 === col)) isEndpoint = true;
          if (h.direction === "v" && h.col === col && (h.row === row || h.row + 1 === row)) isEndpoint = true;
        }
        if (isEndpoint) {
          ctx.fillStyle = playerColors[currentPlayer];
          ctx.globalAlpha = 0.25;
          ctx.beginPath();
          ctx.arc(x, y, config.dotRadius * 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
        ctx.fillStyle = config.colors.foreground;
        ctx.beginPath();
        ctx.arc(x, y, config.dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const line = getLineFromMouse(mouseX, mouseY);

    if (gameOver || aiThinking) return;
    if (aiMode && currentPlayer === 2) return;
    if (line && !isLinePlaced(line.row, line.col, line.direction)) {
      placeLine(line.row, line.col, line.direction);
      const completed = checkBoxes();
      if (completed === 0) {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
      }
      updateTurnIndicator();
      updateScores();
      checkGameOver();
      drawBoard();

      if (aiMode && currentPlayer === 2 && !gameOver) {
        doAiTurn();
      }
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    if (gameOver || aiThinking) return;
    let line = getLineFromMouse(mouseX, mouseY);
    if (line && isLinePlaced(line.row, line.col, line.direction)) {
      line = null;
    }

    const changed =
      (line === null) !== (hoveredLine === null) ||
      (line && hoveredLine && (line.row !== hoveredLine.row || line.col !== hoveredLine.col || line.direction !== hoveredLine.direction));

    if (changed) {
      hoveredLine = line;
      drawBoard();
    }

    canvas.style.cursor = line ? "pointer" : "default";
  });

  canvas.addEventListener("mouseleave", () => {
    hoveredLine = null;
    canvas.style.cursor = "default";
    drawBoard();
  });

  function resetGame(size) {
    initGame(size || config.gridSize);
    updateTurnIndicator();
    updateScores();
    drawBoard();
  }

  document.getElementById("new-game").addEventListener("click", () => resetGame());

  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelector(".mode-btn.active").classList.remove("active");
      btn.classList.add("active");
      aiMode = btn.dataset.mode === "ai";
      resetGame();
    });
  });

  document.querySelectorAll(".size-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelector(".size-btn.active").classList.remove("active");
      btn.classList.add("active");
      resetGame(Number(btn.dataset.size));
    });
  });

  updateTurnIndicator();
  updateScores();
  drawBoard();
});
