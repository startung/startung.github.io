// js/gameBoard.js
import { playDropSound } from './soundManager.js';

export function initializeBoard(getBoardState, gameBoardElement, ROWS, COLS, handleColumnClick, getGameActiveStatus) {
    console.log("gameBoard.js: initializeBoard called with board state getter:", getBoardState());
    let board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0)); // Local board for initial setup
    gameBoardElement.innerHTML = '';
    gameBoardElement.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;

            if (c === 0) { // Left column starts with Player 2 at the bottom
                board[r][c] = (r % 2 !== (ROWS - 1) % 2) ? 1 : 2;
                const piece = document.createElement('div');
                piece.classList.add('piece', `player${board[r][c]}`);
                cell.appendChild(piece);
            } else if (c === COLS - 1) { // Right column starts with Player 1 at the bottom
                board[r][c] = (r % 2 === (ROWS - 1) % 2) ? 1 : 2;
                const piece = document.createElement('div');
                piece.classList.add('piece', `player${board[r][c]}`);
                cell.appendChild(piece);
            }
            gameBoardElement.appendChild(cell);
        }
    }

    for (let c = 0; c < COLS; c++) {
        const topCell = gameBoardElement.querySelector(`[data-row="0"][data-col="${c}"]`);
        if (topCell && (c !== 0 && c !== COLS - 1)) {
            topCell.addEventListener('click', () => handleColumnClick(c));
            topCell.addEventListener('mouseover', () => highlightColumn(gameBoardElement, getBoardState(), getGameActiveStatus, ROWS, COLS, c, true));
            topCell.addEventListener('mouseout', () => highlightColumn(gameBoardElement, getBoardState(), getGameActiveStatus, ROWS, COLS, c, false));
        }
    }
    return board; // Return the initially configured board
}

export function renderPiece(gameBoardElement, row, col, player, getGameActiveStatus, isMuted) {
    const cell = gameBoardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (cell.firstChild) {
        cell.removeChild(cell.firstChild);
    }
    const piece = document.createElement('div');
    piece.classList.add('piece', `player${player}`);
    cell.appendChild(piece);

    // Add dropping animation
    piece.classList.add('dropping');
    setTimeout(() => {
        piece.classList.remove('dropping');
    }, 300);

    // Play drop sound
    if (getGameActiveStatus() && !isMuted) {
        playDropSound();
    }
}

export function highlightColumn(gameBoardElement, boardState, getGameActiveStatus, ROWS, COLS, col, shouldHighlight) {
    console.log("gameBoard.js: highlightColumn called. boardState:", boardState, "gameActive:", getGameActiveStatus());
    const isColumnFull = boardState[0][col] !== 0;
    if (!getGameActiveStatus() || isColumnFull) return;

    for (let r = 0; r < ROWS; r++) {
        const cell = gameBoardElement.querySelector(`[data-row="${r}"][data-col="${col}"]`);
        if (cell) {
            if (shouldHighlight) {
                cell.classList.add('droppable-column');
            } else {
                cell.classList.remove('droppable-column');
            }
        }
    }
}