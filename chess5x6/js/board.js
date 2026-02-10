/**
 * Board state and square management for 5x6 Chess
 */

const Board = {
    // Board dimensions
    ROWS: 6,
    COLS: 5,

    // MinitChess starting position (row 0 = rank 1, row 5 = rank 6)
    // Gardner setup with black pieces reversed
    STARTING_POSITION: [
        ['R', 'N', 'B', 'Q', 'K'],  // row 0 (rank 1) - White back rank: RNBQK
        ['P', 'P', 'P', 'P', 'P'],  // row 1 (rank 2) - White pawns
        [null, null, null, null, null], // row 2 (rank 3)
        [null, null, null, null, null], // row 3 (rank 4)
        ['p', 'p', 'p', 'p', 'p'],  // row 4 (rank 5) - Black pawns
        ['k', 'q', 'b', 'n', 'r']   // row 5 (rank 6) - Black back rank: reversed (kqbnr)
    ],

    // Pawn starting rows
    PAWN_START_ROWS: {
        white: 1,  // row 1 (rank 2)
        black: 4   // row 4 (rank 5)
    },

    // Promotion rows
    PROMOTION_ROWS: {
        white: 5,  // row 5 (rank 6)
        black: 0   // row 0 (rank 1)
    },

    /**
     * Create a deep copy of the board
     * @param {Array} board 
     * @returns {Array}
     */
    clone(board) {
        return board.map(row => [...row]);
    },

    /**
     * Get a piece at a specific square
     * @param {Array} board 
     * @param {number} row 
     * @param {number} col 
     * @returns {string|null}
     */
    getPiece(board, row, col) {
        if (!this.isValidSquare(row, col)) return null;
        return board[row][col];
    },

    /**
     * Set a piece at a specific square
     * @param {Array} board 
     * @param {number} row 
     * @param {number} col 
     * @param {string|null} piece 
     */
    setPiece(board, row, col, piece) {
        if (this.isValidSquare(row, col)) {
            board[row][col] = piece;
        }
    },

    /**
     * Check if coordinates are within board bounds
     * @param {number} row 
     * @param {number} col 
     * @returns {boolean}
     */
    isValidSquare(row, col) {
        return row >= 0 && row < this.ROWS && col >= 0 && col < this.COLS;
    },

    /**
     * Convert algebraic notation to coordinates
     * @param {string} notation - e.g., 'a1', 'e6'
     * @returns {Object|null} {row, col}
     */
    notationToCoords(notation) {
        if (!notation || notation.length !== 2) return null;
        const file = notation[0].toLowerCase();
        const rank = parseInt(notation[1]);
        
        const col = file.charCodeAt(0) - 'a'.charCodeAt(0);
        const row = rank - 1; // Convert rank 1-6 to row 0-5
        
        if (this.isValidSquare(row, col)) {
            return { row, col };
        }
        return null;
    },

    /**
     * Convert coordinates to algebraic notation
     * @param {number} row 
     * @param {number} col 
     * @returns {string}
     */
    coordsToNotation(row, col) {
        if (!this.isValidSquare(row, col)) return '';
        const file = String.fromCharCode('a'.charCodeAt(0) + col);
        const rank = row + 1;
        return file + rank;
    },

    /**
     * Check if a square is empty
     * @param {Array} board 
     * @param {number} row 
     * @param {number} col 
     * @returns {boolean}
     */
    isEmpty(board, row, col) {
        return this.getPiece(board, row, col) === null;
    },

    /**
     * Check if a pawn is on its starting row
     * @param {string} piece 
     * @param {number} row 
     * @returns {boolean}
     */
    isPawnStartRow(piece, row) {
        if (!piece) return false;
        const color = Pieces.getColor(piece);
        const type = Pieces.getType(piece);
        if (type !== 'PAWN') return false;
        return row === this.PAWN_START_ROWS[color];
    },

    /**
     * Check if a pawn has reached promotion rank
     * @param {string} piece 
     * @param {number} row 
     * @returns {boolean}
     */
    isPromotionRank(piece, row) {
        if (!piece) return false;
        const color = Pieces.getColor(piece);
        const type = Pieces.getType(piece);
        if (type !== 'PAWN') return false;
        return row === this.PROMOTION_ROWS[color];
    },

    /**
     * Count pieces of a specific color on the board
     * @param {Array} board 
     * @param {string} color - 'white' or 'black'
     * @returns {number}
     */
    countPieces(board, color) {
        let count = 0;
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const piece = this.getPiece(board, row, col);
                if (piece && Pieces.getColor(piece) === color) {
                    count++;
                }
            }
        }
        return count;
    },

    /**
     * Get all squares containing pieces of a color
     * @param {Array} board 
     * @param {string} color - 'white' or 'black'
     * @returns {Array} Array of {row, col, piece}
     */
    getPiecesOfColor(board, color) {
        const pieces = [];
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const piece = this.getPiece(board, row, col);
                if (piece && Pieces.getColor(piece) === color) {
                    pieces.push({ row, col, piece });
                }
            }
        }
        return pieces;
    },

    /**
     * Initialize a new board with starting position
     * @returns {Array}
     */
    create() {
        return this.clone(this.STARTING_POSITION);
    },

    /**
     * Get the direction pawns move for a color
     * @param {string} color 
     * @returns {number} -1 for white (up), +1 for black (down)
     */
    getPawnDirection(color) {
        return color === 'white' ? 1 : -1;
    },

    /**
     * Check if the path between two squares is clear (for sliding pieces)
     * @param {Array} board 
     * @param {number} fromRow 
     * @param {number} fromCol 
     * @param {number} toRow 
     * @param {number} toCol 
     * @returns {boolean}
     */
    isPathClear(board, fromRow, fromCol, toRow, toCol) {
        const dRow = Math.sign(toRow - fromRow);
        const dCol = Math.sign(toCol - fromCol);
        
        let row = fromRow + dRow;
        let col = fromCol + dCol;
        
        while (row !== toRow || col !== toCol) {
            if (!this.isEmpty(board, row, col)) {
                return false;
            }
            row += dRow;
            col += dCol;
        }
        
        return true;
    },

    /**
     * Find the King of a specific color
     * @param {Array} board 
     * @param {string} color - 'white' or 'black'
     * @returns {Object|null} {row, col} or null if not found
     */
    findKing(board, color) {
        const kingPiece = color === 'white' ? 'K' : 'k';
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.getPiece(board, row, col) === kingPiece) {
                    return { row, col };
                }
            }
        }
        return null;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Board;
}
