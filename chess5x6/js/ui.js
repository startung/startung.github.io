/**
 * UI Controller for 5x6 Chess
 * Handles DOM manipulation, event handling, and rendering
 */

const UI = {
    // DOM Elements
    elements: {},

    /**
     * Initialize the UI
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.bindGameEvents();
        Game.init();
    },

    /**
     * Cache DOM element references
     */
    cacheElements() {
        this.elements.board = document.getElementById('board');
        this.elements.currentPlayer = document.getElementById('current-player');
        this.elements.moveCount = document.getElementById('move-count');
        this.elements.moveList = document.getElementById('move-list');
        this.elements.capturedWhite = document.querySelector('#captured-white .pieces-list');
        this.elements.capturedBlack = document.querySelector('#captured-black .pieces-list');
        this.elements.btnNewGame = document.getElementById('btn-new-game');
        this.elements.btnUndo = document.getElementById('btn-undo');
        this.elements.btnAIToggle = document.getElementById('btn-ai-toggle');
        this.elements.gameOverModal = document.getElementById('game-over-modal');
        this.elements.gameResult = document.getElementById('game-result');
        this.elements.gameResultDetail = document.getElementById('game-result-detail');
        this.elements.btnPlayAgain = document.getElementById('btn-play-again');
        this.elements.promotionModal = document.getElementById('promotion-modal');
        this.elements.promotionOptions = document.getElementById('promotion-options');
        this.elements.colorSelectModal = document.getElementById('color-select-modal');
        this.elements.btnPlayWhite = document.getElementById('btn-play-white');
        this.elements.btnPlayBlack = document.getElementById('btn-play-black');
        this.elements.btnCancelAI = document.getElementById('btn-cancel-ai');
        this.elements.rulesModal = document.getElementById('rules-modal');
        this.elements.btnRules = document.getElementById('btn-rules');
        this.elements.btnCloseRules = document.getElementById('btn-close-rules');
    },

    /**
     * Bind DOM event listeners
     */
    bindEvents() {
        // New game button
        this.elements.btnNewGame.addEventListener('click', () => {
            Game.init({ vsAI: false, aiColor: 'black' });
            this.elements.btnUndo.disabled = true;
            this.elements.btnAIToggle.textContent = 'Play vs AI: OFF';
        });

        // Undo button
        this.elements.btnUndo.addEventListener('click', () => {
            Game.undo();
        });

        // AI toggle button - show color selection modal
        this.elements.btnAIToggle.addEventListener('click', () => {
            if (Game.state.vsAI) {
                // Turn off AI
                Game.init({ vsAI: false, aiColor: 'black' });
                this.elements.btnAIToggle.textContent = 'Play vs AI: OFF';
            } else {
                // Show color selection modal
                this.elements.colorSelectModal.classList.remove('hidden');
            }
        });

        // Play as White
        this.elements.btnPlayWhite.addEventListener('click', () => {
            this.elements.colorSelectModal.classList.add('hidden');
            Game.init({ vsAI: true, aiColor: 'black' });
            this.elements.btnAIToggle.textContent = 'Play vs AI: ON (White)';
            this.elements.btnUndo.disabled = true;
        });

        // Play as Black
        this.elements.btnPlayBlack.addEventListener('click', () => {
            this.elements.colorSelectModal.classList.add('hidden');
            Game.init({ vsAI: true, aiColor: 'white' });
            this.elements.btnAIToggle.textContent = 'Play vs AI: ON (Black)';
            this.elements.btnUndo.disabled = true;
        });

        // Cancel AI selection
        this.elements.btnCancelAI.addEventListener('click', () => {
            this.elements.colorSelectModal.classList.add('hidden');
        });

        // Play again button
        this.elements.btnPlayAgain.addEventListener('click', () => {
            this.elements.gameOverModal.classList.add('hidden');
            const wasAI = Game.state.vsAI;
            const lastAIColor = Game.state.aiColor;
            if (wasAI) {
                Game.init({ vsAI: true, aiColor: lastAIColor });
            } else {
                Game.init({ vsAI: false, aiColor: 'black' });
            }
            this.elements.btnUndo.disabled = true;
        });

        // Rules button
        this.elements.btnRules.addEventListener('click', () => {
            this.elements.rulesModal.classList.remove('hidden');
        });

        // Close rules button
        this.elements.btnCloseRules.addEventListener('click', () => {
            this.elements.rulesModal.classList.add('hidden');
        });

        // Close rules when clicking outside
        this.elements.rulesModal.addEventListener('click', (e) => {
            if (e.target === this.elements.rulesModal) {
                this.elements.rulesModal.classList.add('hidden');
            }
        });
    },

    /**
     * Bind game event callbacks
     */
    bindGameEvents() {
        Game.on('onBoardUpdate', (board) => this.renderBoard(board));
        Game.on('onPlayerChange', (player) => this.updatePlayerDisplay(player));
        Game.on('onMoveMade', (move) => this.addMoveToHistory(move));
        Game.on('onCapture', (capture) => this.updateCapturedPieces(capture));
        Game.on('onLegalMovesUpdate', (moves) => this.highlightLegalMoves(moves));
        Game.on('onGameOver', (result) => this.showGameOver(result));
        Game.on('onPromotionRequired', (data) => this.showPromotionModal(data));
    },

    /**
     * Render the chess board
     * @param {Array} board 
     */
    renderBoard(board) {
        this.elements.board.innerHTML = '';
        const state = Game.getState();

        for (let row = Board.ROWS - 1; row >= 0; row--) {
            for (let col = 0; col < Board.COLS; col++) {
                const square = document.createElement('div');
                const isLight = (row + col) % 2 === 0;
                
                square.className = `square ${isLight ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;

                // Highlight selected square
                if (state.selectedSquare && 
                    state.selectedSquare.row === row && 
                    state.selectedSquare.col === col) {
                    square.classList.add('selected');
                }

                // Highlight last move
                if (state.lastMove) {
                    if ((state.lastMove.from.row === row && state.lastMove.from.col === col) ||
                        (state.lastMove.to.row === row && state.lastMove.to.col === col)) {
                        square.classList.add('last-move');
                    }
                }

                // Add piece
                const piece = Board.getPiece(board, row, col);
                if (piece) {
                    const pieceEl = document.createElement('span');
                    const pieceType = Pieces.getType(piece).toLowerCase();
                    const pieceColor = Pieces.getColor(piece);
                    pieceEl.className = `piece ${pieceColor} ${pieceType}`;
                    pieceEl.draggable = true;
                    
                    // Drag events
                    pieceEl.addEventListener('dragstart', (e) => this.handleDragStart(e, row, col));
                    
                    square.appendChild(pieceEl);
                }

                // Click event
                square.addEventListener('click', () => this.handleSquareClick(row, col));
                
                // Drag drop events
                square.addEventListener('dragover', (e) => this.handleDragOver(e));
                square.addEventListener('drop', (e) => this.handleDrop(e, row, col));

                this.elements.board.appendChild(square);
            }
        }
    },

    /**
     * Handle square click
     * @param {number} row 
     * @param {number} col 
     */
    handleSquareClick(row, col) {
        const result = Game.selectSquare(row, col);
        
        // Re-render to show selection
        const state = Game.getState();
        this.renderBoard(state.board);
        
        // Enable undo if moves exist
        this.elements.btnUndo.disabled = state.moveHistory.length === 0;
    },

    /**
     * Handle drag start
     * @param {DragEvent} e 
     * @param {number} row 
     * @param {number} col 
     */
    handleDragStart(e, row, col) {
        e.dataTransfer.setData('text/plain', `${row},${col}`);
        e.dataTransfer.effectAllowed = 'move';
        
        // Select the square to show legal moves
        Game.selectSquare(row, col);
        this.renderBoard(Game.getState().board);
    },

    /**
     * Handle drag over
     * @param {DragEvent} e 
     */
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    },

    /**
     * Handle drop
     * @param {DragEvent} e 
     * @param {number} toRow 
     * @param {number} toCol 
     */
    handleDrop(e, toRow, toCol) {
        e.preventDefault();
        const data = e.dataTransfer.getData('text/plain');
        const [fromRow, fromCol] = data.split(',').map(Number);
        
        Game.makeMove(fromRow, fromCol, toRow, toCol);
        this.elements.btnUndo.disabled = false;
    },

    /**
     * Highlight legal moves
     * @param {Array} moves 
     */
    highlightLegalMoves(moves) {
        const squares = this.elements.board.querySelectorAll('.square');
        
        squares.forEach(square => {
            square.classList.remove('legal-move', 'legal-capture');
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            
            const move = moves.find(m => m.row === row && m.col === col);
            if (move) {
                if (move.isCapture) {
                    square.classList.add('legal-capture');
                } else {
                    square.classList.add('legal-move');
                }
            }
        });
    },

    /**
     * Update player display
     * @param {string} player 
     */
    updatePlayerDisplay(player) {
        const state = Game.getState();
        let text = `${player.charAt(0).toUpperCase() + player.slice(1)}'s turn`;
        
        // Show move count for 40-move rule
        text += ` (${state.moveCount}/40)`;
        
        this.elements.currentPlayer.textContent = text;
        this.elements.currentPlayer.style.color = 'var(--cyan)';
    },

    /**
     * Add move to history display
     * @param {Object} move 
     */
    addMoveToHistory(move) {
        const moveEl = document.createElement('span');
        moveEl.className = 'move-entry';
        
        const moveNumber = Math.ceil(move.moveNumber / 2);
        const isWhite = move.player === 'white';
        
        if (isWhite) {
            moveEl.textContent = `${moveNumber}. ${move.notation}`;
        } else {
            moveEl.textContent = move.notation;
        }
        
        this.elements.moveList.appendChild(moveEl);
        this.elements.moveList.scrollTop = this.elements.moveList.scrollHeight;
        
        // Update move count
        this.elements.moveCount.textContent = `Move: ${moveNumber}`;
    },

    /**
     * Update captured pieces display
     * @param {Object} capture 
     */
    updateCapturedPieces(capture) {
        const container = capture.by === 'white' 
            ? this.elements.capturedWhite 
            : this.elements.capturedBlack;
        
        const pieceEl = document.createElement('span');
        pieceEl.textContent = Pieces.getSymbol(capture.piece);
        container.appendChild(pieceEl);
    },

    /**
     * Show game over modal
     * @param {Object} result 
     */
    showGameOver(result) {
        const title = result.winner === 'draw' 
            ? 'Game Drawn!' 
            : `${result.winner.charAt(0).toUpperCase() + result.winner.slice(1)} Wins!`;
        
        let detail;
        if (result.reason === 'king-captured') {
            detail = 'King captured! You win by capture.';
        } else if (result.reason === 'stalemate') {
            detail = 'Stalemate! No legal moves = you lose!';
        } else if (result.reason === '40-move-rule') {
            detail = '40 moves reached - Game is a draw.';
        } else {
            detail = 'Game over';
        }
        
        this.elements.gameResult.textContent = title;
        this.elements.gameResultDetail.textContent = detail;
        this.elements.gameOverModal.classList.remove('hidden');
    },

    /**
     * Show promotion modal
     * @param {Object} data 
     */
    showPromotionModal(data) {
        this.elements.promotionOptions.innerHTML = '';
        
        const options = Pieces.getPromotionPieces(data.color);
        
        options.forEach(piece => {
            const option = document.createElement('div');
            option.className = 'promotion-piece';
            option.textContent = Pieces.getSymbol(piece);
            option.addEventListener('click', () => {
                Game.promote(piece);
                this.elements.promotionModal.classList.add('hidden');
                this.elements.btnUndo.disabled = false;
            });
            this.elements.promotionOptions.appendChild(option);
        });
        
        this.elements.promotionModal.classList.remove('hidden');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}
