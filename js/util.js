'use strict';

function createCell() {
    var cell = {
        minesAroundCount: 0,
        isShown: false,
        isMine: false,
        isMarked: false,
    }
    return cell;
}
function buildBoard() {
    var board = [];
    for (var i = 0; i < gLevel.ROWS; i++) {
        board[i] = [];
        for (var j = 0; j < gLevel.COLS; j++) {
            var piece = createCell()
            board[i][j] = piece;
        }
    }
    return board;
}
function setMinesNegsCount() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var negs = countNeighbors(i, j, gBoard)
            gBoard[i][j].minesAroundCount = negs
        }
    }
}
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function countNeighbors(cellI, cellJ, board) {
    var neighborsCount = 0;
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue;
            if (j < 0 || j >= board[i].length) continue;
            if (board[i][j].isMine) neighborsCount++;
        }
    }
    return neighborsCount;
}
function genCoords(coordsId) {
    var strToArray = coordsId.split('-');
    var coordsI = +strToArray[1]
    var coordsJ = +strToArray[2]
    var coordsObj = {
        i: coordsI,
        j: coordsJ
    }
    return coordsObj
}
function renderCell(location, value) {
    var elCell = document.querySelector(`#cell-${location.i}-${location.j}`);
    elCell.innerText = value;
}
function restartScores() {
    localStorage.Easy = 0
    localStorage.Medium = 0
    localStorage.Hard = 0
    document.querySelector('.easy').innerText = 0;
    document.querySelector('.medium').innerText = 0;
    document.querySelector('.hard').innerText = 0;
}

