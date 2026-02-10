/**
 * Piece definitions and utilities for 5x6 Chess
 */

const Pieces = {
    // Unicode symbols for pieces
    SYMBOLS: {
        white: {
            K: '♔', // King
            Q: '♕', // Queen
            R: '♖', // Rook
            N: '♘', // Knight
            B: '♗', // Bishop
            P: '♙'  // Pawn
        },
        black: {
            k: '♚', // King
            q: '♛', // Queen
            r: '♜', // Rook
            n: '♞', // Knight
            b: '♝', // Bishop
            p: '♟'  // Pawn
        }
    },

    // Piece types (uppercase = white, lowercase = black)
    TYPES: {
        KING: ['K', 'k'],
        QUEEN: ['Q', 'q'],
        ROOK: ['R', 'r'],
        KNIGHT: ['N', 'n'],
        BISHOP: ['B', 'b'],
        PAWN: ['P', 'p']
    },

    /**
     * Get the color of a piece
     * @param {string} piece - Piece character (e.g., 'R', 'n')
     * @returns {string|null} 'white', 'black', or null if empty
     */
    getColor(piece) {
        if (!piece) return null;
        return piece === piece.toUpperCase() ? 'white' : 'black';
    },

    /**
     * Get the type of a piece (normalized to uppercase)
     * @param {string} piece - Piece character
     * @returns {string} Piece type (KING, QUEEN, ROOK, KNIGHT, BISHOP, PAWN)
     */
    getType(piece) {
        if (!piece) return null;
        const upper = piece.toUpperCase();
        if (upper === 'K') return 'KING';
        if (upper === 'Q') return 'QUEEN';
        if (upper === 'R') return 'ROOK';
        if (upper === 'N') return 'KNIGHT';
        if (upper === 'B') return 'BISHOP';
        if (upper === 'P') return 'PAWN';
        return null;
    },

    /**
     * Get the Unicode symbol for a piece
     * @param {string} piece - Piece character
     * @returns {string} Unicode symbol
     */
    getSymbol(piece) {
        if (!piece) return '';
        const color = this.getColor(piece);
        return this.SYMBOLS[color][piece];
    },

    /**
     * Check if a piece is a sliding piece (rook or bishop)
     * @param {string} piece - Piece character
     * @returns {boolean}
     */
    isSliding(piece) {
        const type = this.getType(piece);
        return type === 'ROOK' || type === 'BISHOP';
    },

    /**
     * Check if two pieces are enemies
     * @param {string} piece1 
     * @param {string} piece2 
     * @returns {boolean}
     */
    areEnemies(piece1, piece2) {
        if (!piece1 || !piece2) return false;
        return this.getColor(piece1) !== this.getColor(piece2);
    },

    /**
     * Get the value of a piece for evaluation
     * @param {string} piece 
     * @returns {number}
     */
    getValue(piece) {
        const type = this.getType(piece);
        switch (type) {
            case 'PAWN': return 100;
            case 'KNIGHT': return 320;
            case 'BISHOP': return 330;
            case 'ROOK': return 500;
            default: return 0;
        }
    },

    /**
     * Get all possible promotion pieces for a color
     * @param {string} color - 'white' or 'black'
     * @returns {string[]} Array of piece characters
     */
    getPromotionPieces(color) {
        return color === 'white' ? ['R', 'N', 'B'] : ['r', 'n', 'b'];
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Pieces;
}
