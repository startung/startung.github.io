// js/soundManager.js
const dropSound = new Audio('assets/sounds/drop.mp3');
const winSound = new Audio('assets/sounds/win.mp3');

dropSound.addEventListener('error', (e) => {
    console.error('Error loading drop sound:', e);
});

winSound.addEventListener('error', (e) => {
    console.error('Error loading win sound:', e);
});

export function playDropSound() {
    dropSound.currentTime = 0;
    dropSound.play();
}

export function playWinSound() {
    winSound.currentTime = 0;
    winSound.play();
}