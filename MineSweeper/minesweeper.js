
let boardWidth = 10;
let boardHeight = 10;
let mine_freq = 7;
let addFlag = false;
const boardDisplay = document.getElementById('board');
const gameMessage = document.getElementById('game-message');

class Tile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.mine = (Math.floor(Math.random()* mine_freq) === 0);
        this.flag = false;
        this.adjMines = 0;
        this.display = false;
    }
}

class Board {
    constructor(boardHeight, boardWidth) {
        this.boardHeight = boardHeight;
        this.boardWidth = boardWidth;
        this.tileArray = [];
        for (let j = 0; j < boardHeight; j++) {
            this.tileRow = [];
            for (let i = 0; i < boardWidth; i++) {
                this.tileRow.push(new Tile(i, j));
            }
            this.tileArray.push(this.tileRow);
        }
        checkAdjMines(this);
    }
    checkRange(i, j) {
        return (i >= 0) && (i < this.boardWidth) && (j >= 0) && (j < this.boardHeight);
    }
}

function checkAdjMines(board) {
    for (let i = 0; i < boardWidth; i++) {
        for (let j = 0; j < boardHeight; j++) {
            if (board.tileArray[i][j].mine) {
                for (let k = -1; k <= 1; k++) {
                    for (let l = -1; l <= 1; l++) {
                        if (board.checkRange(i+k, j+l)) {
                            board.tileArray[i+k][j+l].adjMines++;
                        }
                    }
                }
            }
        }
    }
}

function render(board) {
    boardDisplay.innerHTML = '';
    for (let j = 0; j < boardHeight; j++) {
        let buttonRow = document.createElement('div');
        buttonRow.className = 'row';
        for (let i = 0; i < boardWidth; i++) {
            let tileButton = document.createElement('button');
            tileButton.className = 'tile';
            if (board.tileArray[i][j].display) {
                if (board.tileArray[i][j].mine) {
                    tileButton.className = 'tile-mine';
                } else {
                    tileButton.className = 'tile-display';
                }
                tileButton.innerText = (board.tileArray[i][j].mine) ? "X" : (board.tileArray[i][j].adjMines) ? board.tileArray[i][j].adjMines : "";
            } else {
                if (board.tileArray[i][j].flag) {
                    tileButton.className = 'tile-display';
                    tileButton.innerText = "F";
                }
                tileButton.addEventListener("click", function() {
                    if (addFlag && !board.tileArray[i][j].flag) {
                        board.tileArray[i][j].flag = true;
                        addFlag = false;
                    } else if (board.tileArray[i][j].flag) {
                        board.tileArray[i][j].flag = false;
                    } else {
                        board.tileArray[i][j].display = true;
                    }
                    checkEmptyTiles(board, i, j);
                    gameCheck(board);
                    render(board);
                });
            }
            buttonRow.appendChild(tileButton);
        }
        boardDisplay.appendChild(buttonRow);
    }
}

function checkEmptyTiles(board, i, j) {
    if (board.tileArray[i][j].adjMines === 0) {
        for (let k = -1; k <= 1; k++) {
            for (let l = -1; l <= 1; l++) {
                if (board.checkRange(i+k, j+l) && !board.tileArray[i+k][j+l].display) {
                    board.tileArray[i+k][j+l].display = true;
                    checkEmptyTiles(board, i+k, j+l);
                }
            }
        }
    }
}

function gameCheck(board) {
    gameOver = true;
    gameLost = false;
    for (let i=0; i<board.boardWidth; i++) {
        for (let j=0; j<board.boardHeight; j++) {
            if (!board.tileArray[i][j].display) {
                if (board.tileArray[i][j].mine && board.tileArray[i][j].flag) {continue};
                gameOver = false;
            }
            if (board.tileArray[i][j].display && board.tileArray[i][j].mine) {
                gameLost = true;
                break;
            }
        }
    }
    if (gameOver || gameLost) {
        gameMessage.innerText = (gameLost) ? "You Lose" : "You Win!";
        for (let i=0; i<board.boardWidth; i++) {
            for (let j=0; j<board.boardHeight; j++) { 
                board.tileArray[i][j].display = true;
            }
        } 
    }
}

let b = new Board(boardHeight, boardWidth);
render(b);

function reset() {
    gameMessage.innerText = '';
    let b = new Board(boardHeight, boardWidth);
    render(b);
}

