// js/gameLogic.js
export function checkWin(board, ROWS, COLS, row, col, winningPiecesArray) {
    const player = board[row][col];

    const directions = [
        [0, 1],   // Horizontal
        [1, 0],   // Vertical
        [1, 1],   // Diagonal /
        [1, -1]   // Diagonal 
    ];

            for (let [dr, dc] of directions) {
                let linePieces = [];
                let r_start = row;
                let c_start = col;
    
                // Find the start of the contiguous line in the negative direction
                for (let i = 1; i < 5; i++) {
                    const r_neg = row - dr * i;
                    const c_neg = col - dc * i;
                    if (r_neg >= 0 && r_neg < ROWS && c_neg >= 0 && c_neg < COLS && board[r_neg][c_neg] === player) {
                        r_start = r_neg;
                        c_start = c_neg;
                    } else {
                        break;
                    }
                }
    
                // Collect all pieces in the contiguous line from start to end
                for (let i = 0; i < 5; i++) {
                    const r = r_start + dr * i;
                    const c = c_start + dc * i;
                    if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
                        linePieces.push({r, c});
                    } else {
                        linePieces = []; // Break contiguity
                        break;
                    }
                }
                console.log("checkWin: linePieces for direction", [dr, dc], ":", linePieces);
    
                if (linePieces.length >= 5) {
                    // Found a winning line, copy up to 5 coordinates to winningPiecesArray
                    winningPiecesArray.push(...linePieces.slice(0, 5));
                    console.log("checkWin: Winning line found. winningPiecesArray:", winningPiecesArray);
                    return true;
                }
            }
            return false;
        }
export function checkTie(board, ROWS, COLS) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] === 0) {
                return false;
            }
        }
    }
    return true;
}