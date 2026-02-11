// js/script.js - Main entry point
import { initializeBoard, renderPiece, highlightColumn } from './gameBoard.js';
import { checkWin, checkTie } from './gameLogic.js';
import { updateCurrentPlayerDisplay, displayGameStatus, highlightWinningPieces, clearWinningPieces, showInstructions, hideInstructions } from './uiManager.js';
import { playDropSound, playWinSound } from './soundManager.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("script.js: DOMContentLoaded started");
    const gameBoardElement = document.getElementById('game-board');
    const currentPlayerSpan = document.getElementById('current-player');
    const gameStatusDiv = document.getElementById('game-status');
    const resetButton = document.getElementById('reset-button');
    const instructionsModal = document.getElementById('instructions-modal');
    const closeButtons = document.querySelectorAll('.close-button, #close-instructions');
    const muteButton = document.getElementById('mute-button');
    const showRulesButton = document.getElementById('show-rules-button'); // Get new button reference

    // New game option elements
    const mode2PlayerRadio = document.getElementById('mode-2player');
    const modeAIRadio = document.getElementById('mode-ai');
    const firstTurnOptionsDiv = document.getElementById('first-turn-options');
    const turnPlayerRadio = document.getElementById('turn-player');
    const turnAIRadio = document.getElementById('turn-ai');

    // Win Modal elements - ADDED
    const winModal = document.getElementById('win-modal');
    const winMessageSpan = document.getElementById('win-message');
    const playAgainButton = document.getElementById('play-again-button');

    const ROWS = 6;
    const COLS = 9;
    let board = [];
    let currentPlayer = 1;
    let gameActive = true;
    let winSoundPlayed = false;
    let isMuted = true; // Mute by default

    // AI specific state
    let isAIMode = false;
    let aiStarts = false; // Player starts by default in AI mode

    // Set initial mute button text
    muteButton.textContent = isMuted ? 'Unmute Sound' : 'Mute Sound';

    // REMOVED: showInstructions(instructionsModal); from here - it's now triggered by button click

    // Add event listeners to close buttons for instructions modal
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            hideInstructions(instructionsModal);
            // After hiding instructions, check if AI needs to make a move
            if (isAIMode && currentPlayer === 2 && gameActive) {
                setTimeout(aiMakeMove, 500); // Small delay for AI to "think"
            }
        });
    });

    // Mute button functionality
    muteButton.addEventListener('click', () => {
        isMuted = !isMuted;
        muteButton.textContent = isMuted ? 'Unmute Sound' : 'Mute Sound';
    });

    // Show Rules button functionality - ADDED
    showRulesButton.addEventListener('click', () => {
        showInstructions(instructionsModal);
    });

    // Function to display winning message pop-up - ADDED
    function showWinMessage(message) {
        winMessageSpan.textContent = message;
        winModal.style.display = 'flex';
    }

    // Play Again button functionality - ADDED
    playAgainButton.addEventListener('click', () => {
        winModal.style.display = 'none'; // Hide win modal
        resetGame();
    });

    // Game Mode selection
    mode2PlayerRadio.addEventListener('change', () => {
        isAIMode = false;
        firstTurnOptionsDiv.style.display = 'none';
        resetGame(); // Reset game to apply new mode
    });

    modeAIRadio.addEventListener('change', () => {
        isAIMode = true;
        firstTurnOptionsDiv.style.display = 'flex'; // Use flex to layout radio buttons
        resetGame(); // Reset game to apply new mode
    });

    // First Turn selection in AI mode
    turnPlayerRadio.addEventListener('change', () => {
        aiStarts = false;
        resetGame();
    });

    turnAIRadio.addEventListener('change', () => {
        aiStarts = true;
        resetGame();
    });

    // Handle a column click (equivalent to dropping a piece)
    function handleColumnClick(col) {
        if (!gameActive) return;

        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r][col] === 0) {
                board[r][col] = currentPlayer;
                renderPiece(gameBoardElement, r, col, currentPlayer, () => gameActive, isMuted);
                let winCoords = [];
                if (checkWin(board, ROWS, COLS, r, col, winCoords)) {
                    showWinMessage(`Player ${currentPlayer} wins!`); // MODIFIED
                    gameActive = false;
                    console.log("script.js: handleColumnClick - winCoords before highlighting:", winCoords);
                    highlightWinningPieces(gameBoardElement, winCoords);
                    if (!winSoundPlayed && !isMuted) { // Only play if not muted
                        playWinSound();
                        winSoundPlayed = true;
                    }
                } else if (checkTie(board, ROWS, COLS)) {
                    showWinMessage("It's a tie!"); // MODIFIED
                    gameActive = false;
                } else {
                    currentPlayer = currentPlayer === 1 ? 2 : 1;
                    updateCurrentPlayerDisplay(currentPlayerSpan, currentPlayer);
                    // If AI mode and it's AI's turn, make AI move
                    if (isAIMode && currentPlayer === 2 && gameActive) {
                        setTimeout(aiMakeMove, 500); // Small delay for AI to "think"
                    }
                }
                return;
            }
        }
        displayGameStatus(gameStatusDiv, 'Column is full! Try another column.');
    }

    // AI logic
    function aiMakeMove() {
        if (!gameActive) return;

        console.log("AI is thinking...");

        const currentBoard = JSON.parse(JSON.stringify(board)); // Deep copy of the board

        // Helper function to simulate a move and check for a win
        const simulateMoveAndCheckWin = (tempBoard, player, col) => {
            let simulatedBoard = JSON.parse(JSON.stringify(tempBoard)); // Deep copy
            let r = -1;
            for (let row = ROWS - 1; row >= 0; row--) {
                if (simulatedBoard[row][col] === 0) {
                    simulatedBoard[row][col] = player;
                    r = row;
                    break;
                }
            }
            if (r === -1) return false; // Column is full

            let winCoords = []; // dummy array, not used in simulation
            return checkWin(simulatedBoard, ROWS, COLS, r, col, winCoords);
        };

        // 1. Check for a winning move
        for (let c = 1; c < COLS - 1; c++) { // Only playable columns
            if (board[0][c] === 0) { // If column not full
                if (simulateMoveAndCheckWin(currentBoard, 2, c)) { // AI is Player 2
                    handleColumnClick(c);
                    return;
                }
            }
        }

        // 2. Check for a blocking move (prevent player 1 from winning)
        for (let c = 1; c < COLS - 1; c++) {
            if (board[0][c] === 0) {
                if (simulateMoveAndCheckWin(currentBoard, 1, c)) { // Player 1
                    handleColumnClick(c);
                    return;
                }
            }
        }

        // 3. Prioritize center columns (simple strategy: prefer middle 3 columns)
        const centerCols = [4, 3, 5, 2, 6, 1, 7]; // Order of preference
        for (let c of centerCols) {
            if (c >= 1 && c < COLS - 1 && board[0][c] === 0) {
                handleColumnClick(c);
                return;
            }
        }

        // 4. Fallback: make a random valid move (should not be reached if centerCols cover all valid cols)
        const validCols = [];
        for (let c = 1; c < COLS - 1; c++) {
            if (board[0][c] === 0) {
                validCols.push(c);
            }
        }

        if (validCols.length > 0) {
            const randomCol = validCols[Math.floor(Math.random() * validCols.length)];
            handleColumnClick(randomCol);
        } else {
            console.warn("AI has no valid moves!");
        }
    }

    // Reset game function
    function resetGame() {
        board = initializeBoard(() => board, gameBoardElement, ROWS, COLS, handleColumnClick, () => gameActive);
        clearWinningPieces(gameBoardElement); // Clear highlights before new game
        currentPlayer = (isAIMode && aiStarts) ? 2 : 1; // Set starting player based on options
        gameActive = true;
        winSoundPlayed = false;
        updateCurrentPlayerDisplay(currentPlayerSpan, currentPlayer);
        displayGameStatus(gameStatusDiv, ''); // Clear game status div - MODIFIED (win message is now pop-up)

        if (isAIMode && currentPlayer === 2) {
            setTimeout(aiMakeMove, 500); // AI makes first move if selected
        }
    }

    // Reset game button functionality
    resetButton.addEventListener('click', resetGame);

    // Initial board setup
    resetGame();
});