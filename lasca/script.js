// Lasca Game - JavaScript Implementation
// Using Dracula color scheme

class LascaGame {
    constructor() {
        this.boardSize = 7;
        this.board = [];
        this.currentPlayer = 1;
        this.selectedPiece = null;
        this.possibleMoves = [];
        this.gameOver = false;
        this.player1Pieces = 11;
        this.player2Pieces = 11;
        
        // Column tracking - count of pieces per player in columns
        this.player1Columns = 0;
        this.player2Columns = 0;
        
        // DOM elements
        this.boardElement = document.getElementById('board');
        this.gameStatusElement = document.getElementById('game-status');
        this.player1CountElement = document.getElementById('player1-count');
        this.player2CountElement = document.getElementById('player2-count');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.rulesBtn = document.getElementById('rules-btn');
        this.closeRulesBtn = document.getElementById('close-rules');
        this.rulesModal = document.getElementById('rules-modal');
        this.aiToggleBtn = document.getElementById('ai-toggle-btn');
        this.aiDifficultySelect = document.getElementById('ai-difficulty');
        this.firstPlayerSelect = document.getElementById('first-player');
        
        // AI state
        this.aiEnabled = false;
        this.aiDifficulty = 'medium';
        this.currentAITurn = false;
        this.firstPlayer = 'human'; // 'human' or 'ai'
        
        // Event listeners
        this.newGameBtn.addEventListener('click', () => this.initializeGame());
        this.rulesBtn.addEventListener('click', () => this.showRules());
        this.closeRulesBtn.addEventListener('click', () => this.closeRules());
        this.aiToggleBtn.addEventListener('click', () => this.toggleAI());
        this.aiDifficultySelect.addEventListener('change', (e) => {
            this.aiDifficulty = e.target.value;
        });
        
        this.firstPlayerSelect.addEventListener('change', (e) => {
            this.firstPlayer = e.target.value;
        });
        
        // Move history
        this.player1HistoryElement = document.getElementById('player1-moves');
        this.player2HistoryElement = document.getElementById('player2-moves');
        
        // Check if elements exist
        if (!this.player1HistoryElement || !this.player2HistoryElement) {
            console.warn('Move history elements not found, creating fallback');
            // This shouldn't happen in normal operation, but let's be safe
            this.player1HistoryElement = { innerHTML: '', appendChild: () => {}, scrollTop: 0, scrollHeight: 0 };
            this.player2HistoryElement = { innerHTML: '', appendChild: () => {}, scrollTop: 0, scrollHeight: 0 };
        }
        
        this.moveHistory = {
            player1: [],
            player2: []
        };
        
        // Debug mode
        this.debugMode = true; // Set to false to disable debug visuals
        
        // Initialize the game
        this.initializeGame();
        
        // Add debug info panel if in debug mode
        if (this.debugMode) {
            this.addDebugInfoPanel();
        }
    }
    
    initializeGame() {
        this.board = [];
        this.selectedPiece = null;
        this.possibleMoves = [];
        this.gameOver = false;
        this.player1Pieces = 11;
        this.player2Pieces = 11;
        
        // Set first player if AI is enabled
        if (this.aiEnabled && this.firstPlayer === 'ai') {
            this.currentPlayer = 2; // AI plays first
        } else {
            this.currentPlayer = 1; // Human plays first
        }
        
        // Clear the board
        this.boardElement.innerHTML = '';
        
        // Clear any existing selection
        this.clearSelection();
        
        // Create the board
        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = `cell ${(row + col) % 2 === 1 ? 'light' : 'dark'}`;
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                
                this.boardElement.appendChild(cell);
                this.board[row][col] = null;
            }
        }
        
        // Set up initial pieces
        this.setupInitialPieces();
        
        // Add coordinate labels
        this.addCoordinateLabels();
        
        // Initialize move history
        this.moveHistory = {
            player1: [],
            player2: []
        };
        
        // Re-get the move history elements in case they were added after constructor
        this.player1HistoryElement = document.getElementById('player1-moves');
        this.player2HistoryElement = document.getElementById('player2-moves');
        
        // Clear move history display
        this.updateMoveHistoryDisplay();
        
        // Update UI
        this.updateGameStatus();
        this.updatePieceCounts();
        
        // If AI is enabled and AI plays first, trigger AI's first move
        if (this.aiEnabled && this.firstPlayer === 'ai' && this.currentPlayer === 2) {
            setTimeout(() => this.handleAITurn(), 1000);
        }
    }
    
    addCoordinateLabels() {
        // Add row labels (numbers 1-7)
        const rowLabels = document.createElement('div');
        rowLabels.className = 'row-labels coordinate-labels';
        for (let i = 1; i <= this.boardSize; i++) {
            const label = document.createElement('div');
            label.className = 'row-label';
            label.textContent = this.boardSize - i + 1; // 7 at top, 1 at bottom
            rowLabels.appendChild(label);
        }
        this.boardElement.appendChild(rowLabels);
        
        // Add column labels (letters A-G)
        const colLabels = document.createElement('div');
        colLabels.className = 'col-labels coordinate-labels';
        for (let i = 0; i < this.boardSize; i++) {
            const label = document.createElement('div');
            label.className = 'col-label';
            label.textContent = String.fromCharCode(65 + i); // A, B, C, ...
            colLabels.appendChild(label);
        }
        this.boardElement.appendChild(colLabels);
    }
    

    
    setupInitialPieces() {
        // Clear board first
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                this.board[row][col] = null;
            }
        }
        
        // Player 1 pieces (bottom) - correct Lasca setup: 4-3-4 pattern
        // Row 6 (back row for player 1): 4 pieces on dark squares (columns 0, 2, 4, 6)
        this.placePiecesInRow(6, 1, [0, 2, 4, 6]);
        
        // Row 5: 3 pieces on dark squares (columns 1, 3, 5)
        this.placePiecesInRow(5, 1, [1, 3, 5]);
        
        // Row 4: 4 pieces on dark squares (columns 0, 2, 4, 6)
        this.placePiecesInRow(4, 1, [0, 2, 4, 6]);
        
        // Player 2 pieces (top) - correct Lasca setup: 4-3-4 pattern
        // Row 0 (back row for player 2): 4 pieces on dark squares (columns 0, 2, 4, 6)
        this.placePiecesInRow(0, 2, [0, 2, 4, 6]);
        
        // Row 1: 3 pieces on dark squares (columns 1, 3, 5)
        this.placePiecesInRow(1, 2, [1, 3, 5]);
        
        // Row 2: 4 pieces on dark squares (columns 0, 2, 4, 6)
        this.placePiecesInRow(2, 2, [0, 2, 4, 6]);
        
        // Verify the setup
        let count1 = 0, count2 = 0;
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col]) {
                    if (this.board[row][col].top.player === 1) count1++;
                    else count2++;
                }
            }
        }
        console.log(`Lasca setup complete: Player 1 has ${count1} pieces, Player 2 has ${count2} pieces`);
    }
    
    placePiecesInRow(row, player, columns) {
        for (const col of columns) {
            if (col >= 0 && col < this.boardSize) {
                // Create a column with a single piece
                this.board[row][col] = {
                    pieces: [{ player: player, king: false }],
                    top: { player: player, king: false }
                };
                this.renderPiece(row, col);
            }
        }
    }
    
    renderPiece(row, col) {
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;
        
        cell.innerHTML = '';
        
        const column = this.board[row][col];
        if (column) {
            // Create container for stacked pieces
            const container = document.createElement('div');
            container.className = 'column-container';
            
            // Render pieces from bottom to top (so bottom piece is first in DOM)
            // Then position them with top piece visually on top
            for (let i = 0; i < column.pieces.length; i++) {
                const piece = column.pieces[i];
                const pieceElement = document.createElement('div');
                const className = `piece player-${piece.player} ${piece.king ? 'king' : ''}`;
                pieceElement.className = className;
                
                // Position pieces with overlapping: bottom piece at bottom, top piece at top
                // Each piece is 5px above the one below it
                const bottomOffset = i * 5;
                pieceElement.style.bottom = `${bottomOffset}px`;
                pieceElement.style.zIndex = i + 1; // Higher index = on top
                
                container.appendChild(pieceElement);
            }
            
            // Add height indicator if more than one piece
            if (column.pieces.length > 1) {
                const heightIndicator = document.createElement('div');
                heightIndicator.className = 'column-height';
                heightIndicator.textContent = column.pieces.length;
                container.appendChild(heightIndicator);
            }
            
            // DEBUG: Add coordinate label
            if (this.debugMode) {
                const coordLabel = document.createElement('div');
                coordLabel.className = 'debug-coord';
                coordLabel.textContent = `${String.fromCharCode(65 + col)}${7 - row}`;
                coordLabel.style.position = 'absolute';
                coordLabel.style.top = '2px';
                coordLabel.style.left = '2px';
                coordLabel.style.fontSize = '10px';
                coordLabel.style.backgroundColor = 'rgba(0,0,0,0.7)';
                coordLabel.style.color = 'white';
                coordLabel.style.padding = '2px';
                coordLabel.style.borderRadius = '3px';
                coordLabel.style.zIndex = '100';
                container.appendChild(coordLabel);
            }
            
            cell.appendChild(container);
        }
        // If no column, cell remains empty (which is correct)
    }
    
    handleCellClick(row, col) {
        if (this.gameOver) return;
        
        const column = this.board[row][col];
        
        // Check if there are any mandatory captures available
        const hasMandatoryCaptures = this.checkForMandatoryCaptures();
        
        // If clicking on a column that belongs to current player
        if (column && column.top.player === this.currentPlayer) {
            // If there are mandatory captures, only allow selecting columns that can capture
            if (hasMandatoryCaptures) {
                const canCapture = this.getPossibleMoves(row, col, column).some(move => move.capture);
                if (canCapture) {
                    this.selectPiece(row, col);
                }
            } else {
                this.selectPiece(row, col);
            }
            return;
        }
        
        // If a column is already selected and this is a valid move
        if (this.selectedPiece && this.isValidMove(row, col)) {
            this.movePiece(row, col);
            return;
        }
        
        // Deselect if clicking on empty cell or opponent's column
        this.clearSelection();
    }
    
    selectPiece(row, col) {
        // Clear previous selection
        this.clearSelection();
        
        this.selectedPiece = { row, col };
        const column = this.board[row][col];
        
        // Highlight selected column
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('highlight');
        
        // Find possible moves
        this.possibleMoves = this.getPossibleMoves(row, col, column);
        
        // Highlight possible moves
        this.possibleMoves.forEach(move => {
            const moveCell = document.querySelector(`.cell[data-row="${move.row}"][data-col="${move.col}"]`);
            if (move.capture) {
                moveCell.classList.add('possible-capture');
            } else {
                moveCell.classList.add('possible-move');
            }
        });
    }
    
    clearSelection() {
        if (!this.selectedPiece) return;
        
        // Remove highlight from selected piece
        const selectedCell = document.querySelector(`.cell[data-row="${this.selectedPiece.row}"][data-col="${this.selectedPiece.col}"]`);
        if (selectedCell) {
            selectedCell.classList.remove('highlight');
        }
        
        // Remove highlights from possible moves
        this.possibleMoves.forEach(move => {
            const moveCell = document.querySelector(`.cell[data-row="${move.row}"][data-col="${move.col}"]`);
            if (moveCell) {
                moveCell.classList.remove('possible-move', 'possible-capture');
            }
        });
        
        this.selectedPiece = null;
        this.possibleMoves = [];
    }
    
    getPossibleMoves(row, col, column) {
        const moves = [];
        const topPiece = column.top;
        // Movement directions: [row_change, col_change]
        // Player 1 (bottom) moves UP (decreasing row numbers)
        // Player 2 (top) moves DOWN (increasing row numbers)
        // Kings can move in all diagonal directions
        const directions = topPiece.king 
            ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
            : (topPiece.player === 1 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]);
        

        
        // Check regular moves (1 square)
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (this.isValidPosition(newRow, newCol) && !this.board[newRow][newCol]) {
                moves.push({ row: newRow, col: newCol, capture: false });
            }
        }
        
        // Check captures (2 squares jump)
        for (const [dr, dc] of directions) {
            const jumpRow = row + dr * 2;
            const jumpCol = col + dc * 2;
            const middleRow = row + dr;
            const middleCol = col + dc;
            
            if (this.isValidPosition(jumpRow, jumpCol) && 
                this.isValidPosition(middleRow, middleCol)) {
                
                const middleContent = this.board[middleRow][middleCol];
                const landingContent = this.board[jumpRow][jumpCol];
                
                // Valid capture conditions:
                // 1. Landing square must be empty
                // 2. Middle square must contain opponent's piece/column
                // 3. Middle square must not be empty
                const isLandingEmpty = landingContent === null;
                const hasOpponentPiece = middleContent !== null && middleContent.top.player !== topPiece.player;
                
                if (isLandingEmpty && hasOpponentPiece) {
                    moves.push({ row: jumpRow, col: jumpCol, capture: true, capturedRow: middleRow, capturedCol: middleCol });
                }
            }
        }
        

        return moves;
    }
    
    isValidMove(row, col) {
        return this.possibleMoves.some(move => move.row === row && move.col === col);
    }
    
    movePiece(newRow, newCol) {
        const oldRow = this.selectedPiece.row;
        const oldCol = this.selectedPiece.col;
        const column = this.board[oldRow][oldCol];
        const move = this.possibleMoves.find(m => m.row === newRow && m.col === newCol);
        
        // Move the entire column
        this.board[oldRow][oldCol] = null;
        this.board[newRow][newCol] = column;
        
        // Clear the old position from the UI
        this.renderPiece(oldRow, oldCol);
        
        // Handle capture - Lasca style: place captured piece under the capturing column
        if (move.capture) {
            const capturedColumn = this.board[move.capturedRow][move.capturedCol];
            
            // Take only the top piece from the captured column
            const capturedPiece = capturedColumn.pieces.pop(); // Remove top piece
            
            // If there are remaining pieces, leave them as a shorter column
            if (capturedColumn.pieces.length > 0) {
                // Update the top piece reference for the remaining column
                capturedColumn.top = capturedColumn.pieces[capturedColumn.pieces.length - 1];
                // The remaining column stays in place
                this.renderPiece(move.capturedRow, move.capturedCol);
            } else {
                // No pieces left, remove the column
                this.board[move.capturedRow][move.capturedCol] = null;
                this.renderPiece(move.capturedRow, move.capturedCol);
            }
            
            // Add the captured piece to the bottom of the capturing column
            column.pieces.unshift(capturedPiece);
            
            // Update the top piece reference
            column.top = column.pieces[column.pieces.length - 1];
            
            // Update column tracking
            if (capturedPiece.player === 1) {
                this.player1Columns++;
                this.player1Pieces--;
            } else {
                this.player2Columns++;
                this.player2Pieces--;
            }
            
            // Check for additional captures
            const additionalMoves = this.getPossibleMoves(newRow, newCol, column);
            const hasAdditionalCaptures = additionalMoves.some(m => m.capture);
            
            if (hasAdditionalCaptures) {
                // Continue turn for additional captures
                this.selectPiece(newRow, newCol);
                this.updatePieceCounts();
                return;
            }
        }
        
        // Check for king promotion
        const topPiece = column.top;
        if ((topPiece.player === 1 && newRow === 0) || (topPiece.player === 2 && newRow === this.boardSize - 1)) {
            topPiece.king = true;
            column.top = topPiece; // Update reference
        }
        
        // Clear selection
        this.clearSelection();
        
        // Check if AI should continue (had captures and more available)
        const hasMoreCaptures = this.checkForMandatoryCaptures();
        
        if (hasMoreCaptures && this.currentPlayer === 2 && this.aiEnabled) {
            // AI continues its turn - don't switch player
            this.gameStatusElement.textContent = `AI is thinking... (multiple capture)`;
            setTimeout(() => this.handleAITurn(), 500);
            return; // Don't switch player or continue
        }
        
        // Record the move in history
        console.log('Recording move:', {
            from: `${String.fromCharCode(65 + oldCol)}${7 - oldRow}`, 
            to: `${String.fromCharCode(65 + newCol)}${7 - newRow}`,
            oldRow, oldCol, newRow, newCol, 
            capture: move.capture
        });
        this.recordMove(oldRow, oldCol, newRow, newCol, move.capture);
        
        // Switch player only if no more captures
        this.switchPlayer();
        
        // Update UI
        this.renderPiece(oldRow, oldCol);
        this.renderPiece(newRow, newCol);
        this.renderPiece(move.capturedRow, move.capturedCol);
        this.updatePieceCounts();
        
        // Check for game over
        this.checkGameOver();
        
        // Trigger AI turn if enabled and it's AI's turn
        if (this.aiEnabled && this.currentPlayer === 2 && !this.gameOver) {
            setTimeout(() => this.handleAITurn(), 500);
        }
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateGameStatus();
        
        // Add coordinate labels
        this.addCoordinateLabels();
    }
    
    recordMove(oldRow, oldCol, newRow, newCol, isCapture) {
        const fromCoord = this.getCoordinateNotation(oldRow, oldCol);
        const toCoord = this.getCoordinateNotation(newRow, newCol);
        
        const moveNotation = isCapture ? `${fromCoord}×${toCoord}` : `${fromCoord}-${toCoord}`;
        
        const currentPlayer = this.currentPlayer;
        const moveEntry = {
            notation: moveNotation,
            from: {row: oldRow, col: oldCol},
            to: {row: newRow, col: newCol},
            capture: isCapture,
            player: currentPlayer,
            timestamp: new Date()
        };
        
        // Add to the appropriate player's history
        if (currentPlayer === 1) {
            this.moveHistory.player1.push(moveEntry);
        } else {
            this.moveHistory.player2.push(moveEntry);
        }
        
        // Update the display
        this.updateMoveHistoryDisplay();
    }
    
    getCoordinateNotation(row, col) {
        // Convert row and column to chess-like notation (A1, B2, etc.)
        // Array row 0 = visual row 7 (top)
        // Array row 6 = visual row 1 (bottom)
        const columnLetters = 'ABCDEFG';
        const columnLetter = columnLetters[col];
        const visualRowNumber = 7 - row; // Convert array row to visual row
        return `${columnLetter}${visualRowNumber}`;
    }
    
    updateMoveHistoryDisplay() {
        // Check if elements exist
        if (!this.player1HistoryElement || !this.player2HistoryElement) {
            console.error('Move history elements not found');
            return;
        }
        
        console.log('Updating move history display:', this.moveHistory);
        
        // Clear current history
        this.player1HistoryElement.innerHTML = '';
        this.player2HistoryElement.innerHTML = '';
        
        // Display Player 1 moves
        if (this.moveHistory && this.moveHistory.player1) {
            this.moveHistory.player1.forEach((move, index) => {
                const moveElement = document.createElement('div');
                moveElement.className = 'move-entry player-1';
                moveElement.textContent = `${index + 1}. ${move.notation}`;
                this.player1HistoryElement.appendChild(moveElement);
            });
        }
        
        // Display Player 2 moves
        if (this.moveHistory && this.moveHistory.player2) {
            this.moveHistory.player2.forEach((move, index) => {
                const moveElement = document.createElement('div');
                moveElement.className = 'move-entry player-2';
                moveElement.textContent = `${index + 1}. ${move.notation}`;
                this.player2HistoryElement.appendChild(moveElement);
            });
        }
        
        // Scroll to bottom to show latest moves
        try {
            this.player1HistoryElement.scrollTop = this.player1HistoryElement.scrollHeight;
            this.player2HistoryElement.scrollTop = this.player2HistoryElement.scrollHeight;
        } catch (e) {
            console.error('Error scrolling move history:', e);
        }
    }
    
    addCoordinateLabels() {
        // Add row labels (numbers 1-7)
        const rowLabels = document.createElement('div');
        rowLabels.className = 'row-labels coordinate-labels';
        for (let i = 1; i <= this.boardSize; i++) {
            const label = document.createElement('div');
            label.className = 'row-label';
            label.textContent = this.boardSize - i + 1; // 7 at top, 1 at bottom
            rowLabels.appendChild(label);
        }
        this.boardElement.appendChild(rowLabels);
        
        // Add column labels (letters A-G)
        const colLabels = document.createElement('div');
        colLabels.className = 'col-labels coordinate-labels';
        for (let i = 0; i < this.boardSize; i++) {
            const label = document.createElement('div');
            label.className = 'col-label';
            label.textContent = String.fromCharCode(65 + i); // A, B, C, ...
            colLabels.appendChild(label);
        }
        this.boardElement.appendChild(colLabels);
    }
    
    updateGameStatus() {
        if (this.gameOver) return;
        
        this.gameStatusElement.textContent = `Player ${this.currentPlayer}'s Turn`;
        this.gameStatusElement.style.color = this.currentPlayer === 1 ? 'var(--green)' : 'var(--pink)';
    }
    
    updatePieceCounts() {
        this.player1CountElement.textContent = this.player1Pieces;
        this.player2CountElement.textContent = this.player2Pieces;
    }
    
    checkGameOver() {
        // Check if one player has no pieces left (including columns)
        if (this.player1Pieces === 0 && this.player1Columns === 0) {
            this.endGame(2);
            return;
        }
        
        if (this.player2Pieces === 0 && this.player2Columns === 0) {
            this.endGame(1);
            return;
        }
        
        // Check if current player has no valid moves
        let hasValidMoves = false;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const column = this.board[row][col];
                if (column && column.top.player === this.currentPlayer) {
                    const moves = this.getPossibleMoves(row, col, column);
                    if (moves.length > 0) {
                        hasValidMoves = true;
                        break;
                    }
                }
            }
            if (hasValidMoves) break;
        }
        
        if (!hasValidMoves) {
            this.endGame(this.currentPlayer === 1 ? 2 : 1);
        }
    }
    
    endGame(winner) {
        this.gameOver = true;
        this.gameStatusElement.textContent = `Player ${winner} Wins!`;
        this.gameStatusElement.style.color = winner === 1 ? 'var(--green)' : 'var(--pink)';
    }
    
    checkForMandatoryCaptures() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const column = this.board[row][col];
                if (column && column.top.player === this.currentPlayer) {
                    const moves = this.getPossibleMoves(row, col, column);
                    if (moves.some(move => move.capture)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    isValidPosition(row, col) {
        return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
    }
    
    toggleAI() {
        this.aiEnabled = !this.aiEnabled;
        this.aiDifficulty = this.aiDifficultySelect.value;
        this.firstPlayer = this.firstPlayerSelect.value;
        
        if (this.aiEnabled) {
            this.aiToggleBtn.textContent = 'Play vs Human';
            this.aiToggleBtn.style.backgroundColor = 'var(--red)';
        } else {
            this.aiToggleBtn.textContent = 'Play vs AI';
            this.aiToggleBtn.style.backgroundColor = 'var(--green)';
        }
        
        this.updateGameStatus();
    }
    
    // Basic AI move selection
    getAIMove() {
        // Find all possible moves for the AI
        const allPossibleMoves = [];
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const column = this.board[row][col];
                if (column && column.top.player === this.currentPlayer) {
                    const moves = this.getPossibleMoves(row, col, column);
                    allPossibleMoves.push(...moves.map(move => ({
                        ...move,
                        fromRow: row,
                        fromCol: col
                    })));
                }
            }
        }
        
        // Prioritize capture moves
        const captureMoves = allPossibleMoves.filter(move => move.capture);
        if (captureMoves.length > 0) {
            // Return a random capture move
            return captureMoves[Math.floor(Math.random() * captureMoves.length)];
        }
        
        // If no captures, return a random regular move
        const regularMoves = allPossibleMoves.filter(move => !move.capture);
        if (regularMoves.length > 0) {
            return regularMoves[Math.floor(Math.random() * regularMoves.length)];
        }
        
        return null; // No moves available
    }
    
    // AI turn handler
    async handleAITurn() {
        if (!this.aiEnabled || this.currentPlayer !== 2) return;
        
        this.currentAITurn = true;
        this.gameStatusElement.textContent = 'AI is thinking...';
        
        // Small delay to simulate thinking
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const aiMove = this.getAIMove();
        
        if (aiMove) {
            console.log('AI selected move:', {
                from: `${String.fromCharCode(65 + aiMove.fromCol)}${7 - aiMove.fromRow}`, 
                to: `${String.fromCharCode(65 + aiMove.col)}${7 - aiMove.row}`,
                fromRow: aiMove.fromRow, fromCol: aiMove.fromCol,
                toRow: aiMove.row, toCol: aiMove.col,
                capture: aiMove.capture
            });
            
            this.selectedPiece = { row: aiMove.fromRow, col: aiMove.fromCol };
            this.possibleMoves = this.getPossibleMoves(aiMove.fromRow, aiMove.fromCol, 
                this.board[aiMove.fromRow][aiMove.fromCol]);
            
            // Make the AI move
            this.movePiece(aiMove.row, aiMove.col);
        } else {
            // No moves available, game over
            this.gameStatusElement.textContent = 'AI has no moves! You win!';
        }
        
        this.currentAITurn = false;
    }
    
    showRules() {
        this.rulesModal.style.display = 'block';
    }
    
    closeRules() {
        this.rulesModal.style.display = 'none';
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LascaGame();
});