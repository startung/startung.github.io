/**
 * Move validation and generation for MinitChess
 */

const Movement = {
    /**
     * Generate all pseudo-legal moves for a piece (without check validation)
     * @param {Array} board 
     * @param {number} row 
     * @param {number} col 
     * @returns {Array} Array of {row, col, isCapture}
     */
    getPseudoLegalMoves(board, row, col) {
        const piece = Board.getPiece(board, row, col);
        if (!piece) return [];

        const type = Pieces.getType(piece);

        switch (type) {
            case 'KING':
                return this.getKingMoves(board, row, col);
            case 'QUEEN':
                return this.getQueenMoves(board, row, col);
            case 'ROOK':
                return this.getRookMoves(board, row, col);
            case 'KNIGHT':
                return this.getKnightMoves(board, row, col);
            case 'BISHOP':
                return this.getBishopMovesMinitChess(board, row, col);
            case 'PAWN':
                return this.getPawnMoves(board, row, col);
            default:
                return [];
        }
    },

    /**
     * Generate all legal moves for a piece
     * In MinitChess, there is NO check/checkmate - King can be captured
     * @param {Array} board 
     * @param {number} row 
     * @param {number} col 
     * @returns {Array} Array of {row, col, isCapture}
     */
    getLegalMoves(board, row, col) {
        // In MinitChess, all pseudo-legal moves are legal
        // (King can move into check, can be captured)
        return this.getPseudoLegalMoves(board, row, col);
    },

    /**
     * Get King moves (1 square any direction)
     * @param {Array} board 
     * @param {number} row 
     * @param {number} col 
     * @returns {Array}
     */
    getKingMoves(board, row, col) {
        const piece = Board.getPiece(board, row, col);
        const color = Pieces.getColor(piece);
        const moves = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;

            if (Board.isValidSquare(newRow, newCol)) {
                const targetPiece = Board.getPiece(board, newRow, newCol);
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol, isCapture: false });
                } else if (Pieces.getColor(targetPiece) !== color) {
                    moves.push({ row: newRow, col: newCol, isCapture: true });
                }
            }
        }

        return moves;
    },

    /**
     * Get Queen moves (combination of Rook and Bishop)
     * @param {Array} board 
     * @param {number} row 
     * @param {number} col 
     * @returns {Array}
     */
    getQueenMoves(board, row, col) {
        // Queen moves like both Rook and Bishop combined
        const rookMoves = this.getRookMoves(board, row, col);
        const bishopMoves = this.getBishopMovesStandard(board, row, col);
        return [...rookMoves, ...bishopMoves];
    },

    /**
     * Get rook moves (orthogonal)
     * @param {Array} board 
     * @param {number} row 
     * @param {number} col 
     * @returns {Array}
     */
    getRookMoves(board, row, col) {
        const piece = Board.getPiece(board, row, col);
        const color = Pieces.getColor(piece);
        const moves = [];
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        for (const [dRow, dCol] of directions) {
            let newRow = row + dRow;
            let newCol = col + dCol;

            while (Board.isValidSquare(newRow, newCol)) {
                const targetPiece = Board.getPiece(board, newRow, newCol);
                
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol, isCapture: false });
                } else {
                    if (Pieces.getColor(targetPiece) !== color) {
                        moves.push({ row: newRow, col: newCol, isCapture: true });
                    }
                    break;
                }

                newRow += dRow;
                newCol += dCol;
            }
        }

        return moves;
    },

    /**
     * Get knight moves (L-shape)
     * @param {Array} board 
     * @param {number} row 
     * @param {number} col 
     * @returns {Array}
     */
    getKnightMoves(board, row, col) {
        const piece = Board.getPiece(board, row, col);
        const color = Pieces.getColor(piece);
        const moves = [];
        const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        for (const [dRow, dCol] of offsets) {
            const newRow = row + dRow;
            const newCol = col + dCol;

            if (Board.isValidSquare(newRow, newCol)) {
                const targetPiece = Board.getPiece(board, newRow, newCol);
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol, isCapture: false });
                } else if (Pieces.getColor(targetPiece) !== color) {
                    moves.push({ row: newRow, col: newCol, isCapture: true });
                }
            }
        }

        return moves;
    },

    /**
     * Get Bishop moves for MinitChess
     * Special rule: Bishop can also move 1 square orthogonal
     * @param {Array} board 
     * @param {number} row 
     * @param {number} col 
     * @returns {Array}
     */
    getBishopMovesMinitChess(board, row, col) {
        const piece = Board.getPiece(board, row, col);
        const color = Pieces.getColor(piece);
        const moves = [];
        
        // Standard diagonal moves (sliding)
        const diagonalDirections = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [dRow, dCol] of diagonalDirections) {
            let newRow = row + dRow;
            let newCol = col + dCol;

            while (Board.isValidSquare(newRow, newCol)) {
                const targetPiece = Board.getPiece(board, newRow, newCol);
                
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol, isCapture: false });
                } else {
                    if (Pieces.getColor(targetPiece) !== color) {
                        moves.push({ row: newRow, col: newCol, isCapture: true });
                    }
                    break;
                }

                newRow += dRow;
                newCol += dCol;
            }
        }
        
        // MinitChess special: 1 square orthogonal (like a Wazir)
        const orthogonalDirections = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dRow, dCol] of orthogonalDirections) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (Board.isValidSquare(newRow, newCol)) {
                const targetPiece = Board.getPiece(board, newRow, newCol);
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol, isCapture: false });
                } else if (Pieces.getColor(targetPiece) !== color) {
                    moves.push({ row: newRow, col: newCol, isCapture: true });
                }
            }
        }

        return moves;
    },

    /**
     * Get standard Bishop moves (diagonal only)
     * @param {Array} board 
     * @param {number} row 
     * @param {number} col 
     * @returns {Array}
     */
    getBishopMovesStandard(board, row, col) {
        const piece = Board.getPiece(board, row, col);
        const color = Pieces.getColor(piece);
        const moves = [];
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

        for (const [dRow, dCol] of directions) {
            let newRow = row + dRow;
            let newCol = col + dCol;

            while (Board.isValidSquare(newRow, newCol)) {
                const targetPiece = Board.getPiece(board, newRow, newCol);
                
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol, isCapture: false });
                } else {
                    if (Pieces.getColor(targetPiece) !== color) {
                        moves.push({ row: newRow, col: newCol, isCapture: true });
                    }
                    break;
                }

                newRow += dRow;
                newCol += dCol;
            }
        }

        return moves;
    },

    /**
     * Get pawn moves
     * @param {Array} board 
     * @param {number} row 
     * @param {number} col 
     * @returns {Array}
     */
    getPawnMoves(board, row, col) {
        const piece = Board.getPiece(board, row, col);
        const color = Pieces.getColor(piece);
        const direction = Board.getPawnDirection(color);
        const moves = [];

        // Forward 1 square
        const forwardRow = row + direction;
        if (Board.isValidSquare(forwardRow, col) && Board.isEmpty(board, forwardRow, col)) {
            moves.push({ row: forwardRow, col: col, isCapture: false });

            // Forward 2 squares from starting position
            if (Board.isPawnStartRow(piece, row)) {
                const doubleRow = row + 2 * direction;
                if (Board.isValidSquare(doubleRow, col) && Board.isEmpty(board, doubleRow, col)) {
                    moves.push({ row: doubleRow, col: col, isCapture: false });
                }
            }
        }

        // Diagonal captures
        const captureCols = [col - 1, col + 1];
        for (const captureCol of captureCols) {
            if (Board.isValidSquare(forwardRow, captureCol)) {
                const targetPiece = Board.getPiece(board, forwardRow, captureCol);
                if (targetPiece && Pieces.getColor(targetPiece) !== color) {
                    moves.push({ row: forwardRow, col: captureCol, isCapture: true });
                }
            }
        }

        return moves;
    },

    /**
     * Generate all legal moves for a player
     * @param {Array} board 
     * @param {string} color - 'white' or 'black'
     * @returns {Array} Array of {from: {row, col}, to: {row, col, isCapture}}
     */
    generateAllMoves(board, color) {
        const allMoves = [];
        const pieces = Board.getPiecesOfColor(board, color);

        for (const { row, col, piece } of pieces) {
            const moves = this.getLegalMoves(board, row, col);
            for (const move of moves) {
                allMoves.push({
                    from: { row, col },
                    to: move,
                    piece: piece
                });
            }
        }

        return allMoves;
    },

    /**
     * Check if a player has any legal moves
     * @param {Array} board 
     * @param {string} color 
     * @returns {boolean}
     */
    hasLegalMoves(board, color) {
        const moves = this.generateAllMoves(board, color);
        return moves.length > 0;
    },

    /**
     * Check if a move is legal
     * @param {Array} board 
     * @param {number} fromRow 
     * @param {number} fromCol 
     * @param {number} toRow 
     * @param {number} toCol 
     * @returns {boolean}
     */
    isLegalMove(board, fromRow, fromCol, toRow, toCol) {
        const legalMoves = this.getLegalMoves(board, fromRow, fromCol);
        return legalMoves.some(move => move.row === toRow && move.col === toCol);
    },

    /**
     * Execute a move on the board
     * @param {Array} board 
     * @param {number} fromRow 
     * @param {number} fromCol 
     * @param {number} toRow 
     * @param {number} toCol 
     * @returns {Object} {board, capturedPiece, isPromotion, capturedKing}
     */
    executeMove(board, fromRow, fromCol, toRow, toCol) {
        const newBoard = Board.clone(board);
        const piece = Board.getPiece(board, fromRow, fromCol);
        const capturedPiece = Board.getPiece(board, toRow, toCol);

        // Move piece
        Board.setPiece(newBoard, toRow, toCol, piece);
        Board.setPiece(newBoard, fromRow, fromCol, null);

        // Check for promotion
        const isPromotion = Pieces.getType(piece) === 'PAWN' && 
                           Board.isPromotionRank(piece, toRow);
        
        // Check if King was captured (win condition in MinitChess)
        const capturedKing = capturedPiece && Pieces.getType(capturedPiece) === 'KING';

        return {
            board: newBoard,
            capturedPiece,
            isPromotion,
            capturedKing,
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece
        };
    },

    /**
     * Execute a promotion move
     * @param {Array} board 
     * @param {number} row 
     * @param {number} col 
     * @param {string} newPiece 
     * @returns {Array}
     */
    executePromotion(board, row, col, newPiece) {
        const newBoard = Board.clone(board);
        Board.setPiece(newBoard, row, col, newPiece);
        return newBoard;
    },

    /**
     * Convert a move to algebraic notation
     * @param {Object} move - {from: {row, col}, to: {row, col}, piece, capturedPiece}
     * @returns {string}
     */
    toNotation(move) {
        const fromNotation = Board.coordsToNotation(move.from.row, move.from.col);
        const toNotation = Board.coordsToNotation(move.to.row, move.to.col);
        const pieceChar = move.piece.toUpperCase();
        const capture = move.capturedPiece ? 'x' : '';
        
        // Pawn moves don't show piece letter, captures show file
        if (pieceChar === 'P') {
            if (capture) {
                return fromNotation[0] + 'x' + toNotation;
            }
            return toNotation;
        }
        
        return pieceChar + capture + toNotation;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Movement;
}
