/**
 * Advanced AI for MinitChess
 * Uses minimax with alpha-beta pruning and positional evaluation
 */

const AI = {
    // Search depth - increase for stronger play (but slower)
    SEARCH_DEPTH: 3,
    
    // Piece values (centipawns)
    PIECE_VALUES: {
        PAWN: 100,
        KNIGHT: 320,
        BISHOP: 330,
        ROOK: 500,
        QUEEN: 900,
        KING: 20000
    },

    // Piece-square tables for positional evaluation
    // Values encourage pieces to go to good squares
    PST: {
        PAWN: [
            [0,  0,  0,  0,  0],
            [50, 50, 50, 50, 50],
            [10, 10, 20, 10, 10],
            [5,  5, 10,  5,  5],
            [0,  0,  0,  0,  0],
            [0,  0,  0,  0,  0]
        ],
        KNIGHT: [
            [-50,-40,-30,-40,-50],
            [-40,-20,  0,-20,-40],
            [-30,  0, 10,  0,-30],
            [-30,  5, 15,  5,-30],
            [-40,-20,  0,-20,-40],
            [-50,-40,-30,-40,-50]
        ],
        BISHOP: [
            [-20,-10,-10,-10,-20],
            [-10,  0,  0,  0,-10],
            [-10,  0, 10,  0,-10],
            [-10,  5,  5,  5,-10],
            [-10,  0,  0,  0,-10],
            [-20,-10,-10,-10,-20]
        ],
        ROOK: [
            [0,  0,  0,  0,  0],
            [5, 10, 10, 10,  5],
            [-5,  0,  0,  0, -5],
            [-5,  0,  0,  0, -5],
            [0,  0,  0,  0,  0],
            [0,  0,  5,  0,  0]
        ],
        QUEEN: [
            [-20,-10,-10,-10,-20],
            [-10,  0,  0,  0,-10],
            [-10,  0, 10,  0,-10],
            [-10,  0,  5,  0,-10],
            [-10,  0,  0,  0,-10],
            [-20,-10,-10,-10,-20]
        ],
        KING: [
            [-30,-40,-40,-40,-30],
            [-30,-40,-40,-40,-30],
            [-20,-30,-30,-30,-20],
            [-10,-20,-20,-20,-10],
            [20, 20,  0, 20, 20],
            [20, 30, 10, 30, 20]
        ]
    },

    // Opening moves for better early game
    OPENING_MOVES: {
        white: [
            { from: { row: 1, col: 2 }, to: { row: 3, col: 2 } }, // c2-c4 (pawn center)
            { from: { row: 1, col: 1 }, to: { row: 3, col: 1 } }, // b2-b4
            { from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }, // d2-d4
            { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // Nb1-c3
            { from: { row: 0, col: 3 }, to: { row: 2, col: 2 } }, // Qd1-c3 (develop queen)
        ],
        black: [
            { from: { row: 4, col: 2 }, to: { row: 2, col: 2 } }, // c5-c4
            { from: { row: 4, col: 1 }, to: { row: 2, col: 1 } }, // b5-b4
            { from: { row: 4, col: 3 }, to: { row: 2, col: 3 } }, // d5-d4
            { from: { row: 5, col: 3 }, to: { row: 3, col: 2 } }, // Nd6-c4
            { from: { row: 5, col: 1 }, to: { row: 3, col: 2 } }, // Qb6-c4
        ]
    },

    /**
     * Get best move for AI
     * @param {Array} board 
     * @param {string} color - 'white' or 'black'
     * @param {number} moveCount - current move number
     * @returns {Object|null} best move or null
     */
    getBestMove(board, color, moveCount) {
        // Check for opening moves in first 2 moves
        if (moveCount < 4) {
            const openingMove = this.getOpeningMove(board, color, moveCount);
            if (openingMove) return openingMove;
        }

        // Use minimax for deeper search
        const moves = Movement.generateAllMoves(board, color);
        if (moves.length === 0) return null;

        let bestMove = null;
        let bestScore = -Infinity;
        const opponent = color === 'white' ? 'black' : 'white';

        // Sort moves for better alpha-beta pruning
        const sortedMoves = this.sortMoves(moves, board, color);

        for (const move of sortedMoves) {
            const testBoard = Board.clone(board);
            const piece = Board.getPiece(testBoard, move.from.row, move.from.col);
            Board.setPiece(testBoard, move.to.row, move.to.col, piece);
            Board.setPiece(testBoard, move.from.row, move.from.col, null);

            // Check for immediate win (king capture)
            const capturedPiece = Board.getPiece(board, move.to.row, move.to.col);
            if (capturedPiece && Pieces.getType(capturedPiece) === 'KING') {
                return move; // Winning move!
            }

            // Check for stalemate win
            const opponentHasMoves = Movement.hasLegalMoves(testBoard, opponent);
            if (!opponentHasMoves) {
                return move; // Winning move by stalemate!
            }

            // Minimax evaluation
            const score = this.minimax(
                testBoard, 
                this.SEARCH_DEPTH - 1, 
                -Infinity, 
                Infinity, 
                false, 
                color, 
                opponent
            );

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    },

    /**
     * Get opening move if available
     */
    getOpeningMove(board, color, moveCount) {
        const openings = this.OPENING_MOVES[color];
        if (!openings) return null;

        // Try each opening move
        for (const opening of openings) {
            const piece = Board.getPiece(board, opening.from.row, opening.from.col);
            if (piece && Pieces.getColor(piece) === color) {
                // Check if this move is legal
                const legalMoves = Movement.getLegalMoves(board, opening.from.row, opening.from.col);
                const isLegal = legalMoves.some(m => 
                    m.row === opening.to.row && m.col === opening.to.col
                );
                if (isLegal) {
                    return {
                        from: opening.from,
                        to: opening.to,
                        piece: piece
                    };
                }
            }
        }
        return null;
    },

    /**
     * Sort moves for better alpha-beta pruning
     * Captures and promotions first
     */
    sortMoves(moves, board, color) {
        return moves.sort((a, b) => {
            const scoreA = this.getMovePriority(a, board, color);
            const scoreB = this.getMovePriority(b, board, color);
            return scoreB - scoreA;
        });
    },

    /**
     * Get priority score for move ordering
     */
    getMovePriority(move, board, color) {
        let score = 0;
        const targetPiece = Board.getPiece(board, move.to.row, move.to.col);
        
        // Prioritize captures (MVV-LVA: Most Valuable Victim - Least Valuable Attacker)
        if (targetPiece) {
            const victimValue = this.PIECE_VALUES[Pieces.getType(targetPiece)];
            const attackerValue = this.PIECE_VALUES[Pieces.getType(move.piece)];
            score += victimValue - attackerValue / 100;
        }
        
        // Prioritize pawn promotions
        if (Pieces.getType(move.piece) === 'PAWN') {
            if (color === 'white' && move.to.row === 5) score += 800;
            if (color === 'black' && move.to.row === 0) score += 800;
        }
        
        // Prioritize center control
        const centerDist = Math.abs(move.to.col - 2) + Math.abs(move.to.row - 2.5);
        score += (4 - centerDist) * 10;
        
        return score;
    },

    /**
     * Minimax algorithm with alpha-beta pruning
     */
    minimax(board, depth, alpha, beta, isMaximizing, aiColor, currentColor) {
        // Terminal conditions
        if (depth === 0) {
            return this.evaluateBoard(board, aiColor);
        }

        const moves = Movement.generateAllMoves(board, currentColor);
        const opponent = currentColor === 'white' ? 'black' : 'white';

        // Check for checkmate/stalemate
        if (moves.length === 0) {
            // Stalemate = win for the player who delivered it
            // So if we're out of moves, the previous player wins
            return isMaximizing ? -100000 : 100000;
        }

        // Check for king capture (shouldn't happen with proper move gen, but safety check)
        const kingPos = Board.findKing(board, currentColor);
        if (!kingPos) {
            // King was captured - previous player wins
            return isMaximizing ? -100000 : 100000;
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const testBoard = Board.clone(board);
                const piece = Board.getPiece(testBoard, move.from.row, move.from.col);
                Board.setPiece(testBoard, move.to.row, move.to.col, piece);
                Board.setPiece(testBoard, move.from.row, move.from.col, null);

                const eval_ = this.minimax(testBoard, depth - 1, alpha, beta, false, aiColor, opponent);
                maxEval = Math.max(maxEval, eval_);
                alpha = Math.max(alpha, eval_);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const testBoard = Board.clone(board);
                const piece = Board.getPiece(testBoard, move.from.row, move.from.col);
                Board.setPiece(testBoard, move.to.row, move.to.col, piece);
                Board.setPiece(testBoard, move.from.row, move.from.col, null);

                const eval_ = this.minimax(testBoard, depth - 1, alpha, beta, true, aiColor, opponent);
                minEval = Math.min(minEval, eval_);
                beta = Math.min(beta, eval_);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
            return minEval;
        }
    },

    /**
     * Evaluate board position from AI's perspective
     */
    evaluateBoard(board, aiColor) {
        let score = 0;
        const opponent = aiColor === 'white' ? 'black' : 'white';

        // Material and positional evaluation
        for (let row = 0; row < Board.ROWS; row++) {
            for (let col = 0; col < Board.COLS; col++) {
                const piece = Board.getPiece(board, row, col);
                if (!piece) continue;

                const type = Pieces.getType(piece);
                const color = Pieces.getColor(piece);
                const value = this.PIECE_VALUES[type];

                // Get piece-square table value
                // Flip table for black pieces
                let pstValue = 0;
                if (this.PST[type]) {
                    if (color === 'white') {
                        pstValue = this.PST[type][row][col];
                    } else {
                        pstValue = this.PST[type][5 - row][col]; // Flip vertically for black
                    }
                }

                if (color === aiColor) {
                    score += value + pstValue;
                } else {
                    score -= value + pstValue;
                }
            }
        }

        // Mobility bonus
        const aiMobility = Movement.generateAllMoves(board, aiColor).length;
        const opponentMobility = Movement.generateAllMoves(board, opponent).length;
        score += (aiMobility - opponentMobility) * 5;

        // King safety - penalty for exposed king
        const aiKing = Board.findKing(board, aiColor);
        const opponentKing = Board.findKing(board, opponent);
        
        if (aiKing) {
            // Penalty for king being far from center in opening/middlegame
            const kingDistFromCenter = Math.abs(aiKing.col - 2) + Math.abs(aiKing.row - 2.5);
            score -= kingDistFromCenter * 5;
        }

        // Bonus for attacking opponent king
        if (opponentKing) {
            const attacksOnKing = this.countAttacksOnSquare(board, opponentKing.row, opponentKing.col, aiColor);
            score += attacksOnKing * 50;
        }

        return score;
    },

    /**
     * Count how many pieces attack a square
     */
    countAttacksOnSquare(board, row, col, byColor) {
        const pieces = Board.getPiecesOfColor(board, byColor);
        let count = 0;
        
        for (const piece of pieces) {
            const moves = Movement.getPseudoLegalMoves(board, piece.row, piece.col);
            if (moves.some(m => m.row === row && m.col === col)) {
                count++;
            }
        }
        
        return count;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AI;
}
