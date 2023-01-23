console.log("Hello, welcome to Tic-Tac-Toe")

i = 0
let tileArray = []
let statement = document.getElementById('winning-statement');
const winCombos = [[1, 2, 3], [4, 5, 6], [7, 8, 9],
                    [1, 4, 7], [2, 5, 8], [3, 6, 9],
                    [1, 5, 9], [3, 5, 7]];
let win = 0;

function updateTileArray() {
    for (let j=0; j<9; j++) {
        tileArray[j] = document.getElementsByClassName("tile")[j].innerHTML;
    }
}

function checkWin() {
    for (let j = 0; j < winCombos.length; j++) {
        if (tileArray[winCombos[j][0]-1] !== '' &&
            tileArray[winCombos[j][0]-1] === tileArray[winCombos[j][1]-1] &&
            tileArray[winCombos[j][0]-1] === tileArray[winCombos[j][2]-1]) {
                return tileArray[winCombos[j][0]-1];
            }
    }
    return 0;
}

function fillTile(num) {
    if (document.getElementsByClassName("tile")[num - 1].innerHTML !== "" ||
    win) {
        return 0;
    }
    document.getElementsByClassName("tile")[num - 1].innerHTML = (i % 2) ? "X" : "O"
    i++
    updateTileArray();
    win = checkWin()
    if (win) {
        statement.innerText = win + "'s win!!!";
    }
    else if (i === 9) {
        statement.innerText = 'CAT';
    }
}

function resetBoard() {
    for (let j=0; j<9; j++) {
        document.getElementsByClassName("tile")[j].innerHTML = '';
    }
    updateTileArray();
    statement.innerText = '';
    win = 0;
    i = 0;
}

console.log(tileArray);