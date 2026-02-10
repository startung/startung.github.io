/**
 * Main game controller for MinitChess
 */

const Game = {
    // Game state
    state: {
        board: null,
        currentPlayer: 'white',
        moveHistory: [],
        capturedPieces: { white: [], black: [] },
        selectedSquare: null,
        legalMoves: [],
        gameOver: false,
        winner: null,
        lastMove: null,
        vsAI: false,
        aiColor: 'black',
        promotionPending: null,
        moveCount: 0  // For 40-move draw rule
    },

    // Event callbacks
    callbacks: {
        onBoardUpdate: null,
        onPlayerChange: null,
        onGameOver: null,
        onMoveMade: null,
        onPromotionRequired: null,
        onCapture: null,
        onLegalMovesUpdate: null
    },

    /**
     * Initialize a new game
     * @param {Object} options - {vsAI: boolean, aiColor: 'white'|'black'}
     */
    init(options = {}) {
        this.state.board = Board.create();
        this.state.currentPlayer = 'white';
        this.state.moveHistory = [];
        this.state.capturedPieces = { white: [], black: [] };
        this.state.selectedSquare = null;
        this.state.legalMoves = [];
        this.state.gameOver = false;
        this.state.winner = null;
        this.state.lastMove = null;
        this.state.vsAI = options.vsAI || false;
        this.state.aiColor = options.aiColor || 'black';
        this.state.promotionPending = null;
        this.state.moveCount = 0;

        this.trigger('onBoardUpdate', this.state.board);
        this.trigger('onPlayerChange', this.state.currentPlayer);

        // If AI plays white, make its move
        if (this.state.vsAI && this.state.aiColor === 'white') {
            setTimeout(() => this.makeAIMove(), 500);
        }
    },

    /**
     * Register an event callback
     * @param {string} event 
     * @param {Function} callback 
     */
    on(event, callback) {
        if (this.callbacks.hasOwnProperty(event)) {
            this.callbacks[event] = callback;
        }
    },

    /**
     * Trigger an event callback
     * @param {string} event 
     * @param {*} data 
     */
    trigger(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event](data);
        }
    },

    /**
     * Select a square and calculate legal moves
     * @param {number} row 
     * @param {number} col 
     * @returns {boolean} true if selection was successful
     */
    selectSquare(row, col) {
        if (this.state.gameOver || this.state.promotionPending) return false;

        const piece = Board.getPiece(this.state.board, row, col);
        
        // If clicking on own piece, select it
        if (piece && Pieces.getColor(piece) === this.state.currentPlayer) {
            this.state.selectedSquare = { row, col };
            this.state.legalMoves = Movement.getLegalMoves(this.state.board, row, col);
            this.trigger('onLegalMovesUpdate', this.state.legalMoves);
            return true;
        }

        // If a piece is already selected, try to move
        if (this.state.selectedSquare) {
            const legalMove = this.state.legalMoves.find(
                m => m.row === row && m.col === col
            );
            
            if (legalMove) {
                return this.makeMove(
                    this.state.selectedSquare.row,
                    this.state.selectedSquare.col,
                    row,
                    col
                );
            }
        }

        // Deselect if clicking elsewhere
        this.state.selectedSquare = null;
        this.state.legalMoves = [];
        this.trigger('onLegalMovesUpdate', []);
        return false;
    },

    /**
     * Make a move
     * @param {number} fromRow 
     * @param {number} fromCol 
     * @param {number} toRow 
     * @param {number} toCol 
     * @returns {boolean} true if move was successful
     */
    makeMove(fromRow, fromCol, toRow, toCol) {
        if (this.state.gameOver || this.state.promotionPending) return false;

        const result = Movement.executeMove(
            this.state.board, fromRow, fromCol, toRow, toCol
        );

        // Handle capture
        if (result.capturedPiece) {
            const capturerColor = this.state.currentPlayer;
            this.state.capturedPieces[capturerColor].push(result.capturedPiece);
            this.trigger('onCapture', {
                piece: result.capturedPiece,
                by: capturerColor
            });
        }

        // Update board
        this.state.board = result.board;
        this.state.lastMove = { from: result.from, to: result.to };
        this.state.moveCount++;

        // Check for King capture (immediate win in MinitChess)
        if (result.capturedKing) {
            this.completeMove(result, true);
            return true;
        }

        // Check for promotion
        if (result.isPromotion) {
            this.state.promotionPending = { row: toRow, col: toCol };
            this.trigger('onPromotionRequired', {
                row: toRow,
                col: toCol,
                color: this.state.currentPlayer
            });
            return true;
        }

        // Complete the move
        this.completeMove(result, false);
        return true;
    },

    /**
     * Complete a move after any promotion is handled
     * @param {Object} moveResult 
     * @param {boolean} kingCaptured - whether the King was captured
     */
    completeMove(moveResult, kingCaptured = false) {
        // Record move
        const notation = Movement.toNotation({
            from: moveResult.from,
            to: moveResult.to,
            piece: moveResult.piece,
            capturedPiece: moveResult.capturedPiece
        });

        this.state.moveHistory.push({
            notation,
            player: this.state.currentPlayer,
            from: moveResult.from,
            to: moveResult.to
        });

        this.trigger('onMoveMade', {
            notation,
            player: this.state.currentPlayer,
            moveNumber: this.state.moveHistory.length
        });

        // Clear selection
        this.state.selectedSquare = null;
        this.state.legalMoves = [];
        this.trigger('onLegalMovesUpdate', []);

        // Check for victory by King capture
        if (kingCaptured) {
            this.state.gameOver = true;
            this.state.winner = this.state.currentPlayer;
            this.trigger('onGameOver', { 
                gameOver: true, 
                winner: this.state.currentPlayer, 
                reason: 'king-captured' 
            });
            return;
        }

        // Check for 40-move draw rule
        if (this.state.moveCount >= 40) {
            this.state.gameOver = true;
            this.state.winner = 'draw';
            this.trigger('onGameOver', { 
                gameOver: true, 
                winner: 'draw', 
                reason: '40-move-rule' 
            });
            return;
        }

        // Switch player
        const opponent = this.state.currentPlayer === 'white' ? 'black' : 'white';
        
        // Check if opponent has any legal moves
        const opponentHasMoves = Movement.hasLegalMoves(this.state.board, opponent);
        
        if (!opponentHasMoves) {
            // In MinitChess, stalemate is a WIN for the player who delivered it
            this.state.gameOver = true;
            this.state.winner = this.state.currentPlayer;
            this.trigger('onGameOver', { 
                gameOver: true, 
                winner: this.state.currentPlayer, 
                reason: 'stalemate' 
            });
            return;
        }

        this.state.currentPlayer = opponent;
        this.trigger('onPlayerChange', this.state.currentPlayer);
        this.trigger('onBoardUpdate', this.state.board);

        // AI move if applicable
        if (this.state.vsAI && this.state.currentPlayer === this.state.aiColor && !this.state.gameOver) {
            setTimeout(() => this.makeAIMove(), 500);
        }
    },

    /**
     * Handle pawn promotion
     * @param {string} piece - Piece to promote to
     */
    promote(piece) {
        if (!this.state.promotionPending) return;

        const { row, col } = this.state.promotionPending;
        this.state.board = Movement.executePromotion(this.state.board, row, col, piece);
        
        this.state.promotionPending = null;
        
        // Continue with opponent's turn
        const opponent = this.state.currentPlayer === 'white' ? 'black' : 'white';
        
        // Check if opponent has any legal moves
        const opponentHasMoves = Movement.hasLegalMoves(this.state.board, opponent);
        
        if (!opponentHasMoves) {
            // Stalemate = win in MinitChess
            this.state.gameOver = true;
            this.state.winner = this.state.currentPlayer;
            this.trigger('onBoardUpdate', this.state.board);
            this.trigger('onGameOver', { 
                gameOver: true, 
                winner: this.state.currentPlayer, 
                reason: 'stalemate' 
            });
            return;
        }

        this.state.currentPlayer = opponent;
        this.trigger('onPlayerChange', this.state.currentPlayer);
        this.trigger('onBoardUpdate', this.state.board);

        // AI move if applicable
        if (this.state.vsAI && this.state.currentPlayer === this.state.aiColor && !this.state.gameOver) {
            setTimeout(() => this.makeAIMove(), 500);
        }
    },

    /**
     * Make an AI move using the advanced AI
     */
    makeAIMove() {
        if (this.state.gameOver) return;

        // Use the advanced AI to get the best move
        const bestMove = AI.getBestMove(
            this.state.board, 
            this.state.aiColor, 
            this.state.moveCount
        );

        if (bestMove) {
            this.makeMove(bestMove.from.row, bestMove.from.col, bestMove.to.row, bestMove.to.col);
        }
    },

    /**
     * Undo the last move
     * @returns {boolean}
     */
    undo() {
        if (this.state.moveHistory.length === 0 || this.state.promotionPending) return false;

        // In AI mode, undo both player and AI moves
        const movesToUndo = this.state.vsAI && this.state.moveHistory.length >= 2 ? 2 : 1;

        for (let i = 0; i < movesToUndo; i++) {
            if (this.state.moveHistory.length === 0) break;

            const lastMove = this.state.moveHistory.pop();
            
            // Restore piece to original position
            const movedPiece = Board.getPiece(this.state.board, lastMove.to.row, lastMove.to.col);
            Board.setPiece(this.state.board, lastMove.from.row, lastMove.from.col, movedPiece);
            Board.setPiece(this.state.board, lastMove.to.row, lastMove.to.col, null);

            this.state.moveCount--;
        }

        // Reset game state
        this.state.gameOver = false;
        this.state.winner = null;
        this.state.currentPlayer = this.state.moveHistory.length % 2 === 0 ? 'white' : 'black';
        this.state.selectedSquare = null;
        this.state.legalMoves = [];
        this.state.lastMove = this.state.moveHistory.length > 0 ? 
            { 
                from: this.state.moveHistory[this.state.moveHistory.length - 1].from,
                to: this.state.moveHistory[this.state.moveHistory.length - 1].to
            } : null;

        this.trigger('onBoardUpdate', this.state.board);
        this.trigger('onPlayerChange', this.state.currentPlayer);
        this.trigger('onLegalMovesUpdate', []);

        return true;
    },

    /**
     * Toggle AI mode
     * @returns {boolean} new AI state
     */
    toggleAI() {
        this.state.vsAI = !this.state.vsAI;
        if (this.state.vsAI) {
            this.init({ vsAI: true, aiColor: 'black' });
        }
        return this.state.vsAI;
    },

    /**
     * Get current game state
     * @returns {Object}
     */
    getState() {
        return { ...this.state };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}
