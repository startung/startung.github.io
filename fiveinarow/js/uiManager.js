// js/uiManager.js
export function updateCurrentPlayerDisplay(currentPlayerSpan, currentPlayer) {
    currentPlayerSpan.textContent = currentPlayer;
    currentPlayerSpan.classList.remove('player1-turn', 'player2-turn');
    currentPlayerSpan.classList.add(`player${currentPlayer}-turn`);
}

export function displayGameStatus(gameStatusDiv, message) {
    gameStatusDiv.textContent = message;
}

export function highlightWinningPieces(gameBoardElement, winningPieces) {
    console.log("uiManager.js: highlightWinningPieces called with:", winningPieces);
    winningPieces.forEach(({r, c}) => {
        const cell = gameBoardElement.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (cell) {
            const piece = cell.querySelector('.piece'); // Get the piece element inside the cell
            if (piece) {
                piece.classList.add('winning-piece');
                console.log("uiManager.js: Added 'winning-piece' to piece:", piece, "classList:", piece.classList);
            } else {
                console.warn("uiManager.js: Could not find piece inside cell for winning piece at r:", r, "c:", c);
            }
        } else {
            console.warn("uiManager.js: Could not find cell for winning piece at r:", r, "c:", c);
        }
    });
}

export function clearWinningPieces(gameBoardElement) {
    document.querySelectorAll('.winning-piece').forEach(piece => {
        piece.classList.remove('winning-piece');
    });
}

export function showInstructions(instructionsModal) {
    instructionsModal.style.display = 'flex';
}

export function hideInstructions(instructionsModal) {
    instructionsModal.style.display = 'none';
}