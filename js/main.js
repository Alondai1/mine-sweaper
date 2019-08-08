'use strict';
var gWinSound = new Audio('sound/win.mp3');
var gFailSound = new Audio('sound/fail.mp3');

var gBoard;
var gClicks = 0;
var gGameInterval;
var gHintInterval;
var FLAG = '🚩';
var MINE = '💣'
var gStartPoint = { i: 0, j: 0 };
var gScore;
var gBestScoreEasy = +localStorage.Easy;
var gBestScoreMedium = +localStorage.Medium;
var gBestScoreHard = +localStorage.Hard;
var gCurrentLevel = 2;

var gLevel = {
    ROWS: 8,
    COLS: 8,
    MINES: 12
};
var gGame = {
    isOn: true,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    lives: 3,
    isHintMode: false,
    hintsCount: 3
}
function initLevel(level) {
    if (level === 1) {
        gLevel.MINES = 2;
        gLevel.ROWS = 4;
        gLevel.COLS = 4;
        gCurrentLevel = 1;
    }
    else if (level === 2) {
        gLevel.MINES = 12;
        gLevel.ROWS = 8;
        gLevel.COLS = 8;
        gCurrentLevel = 2;
    }
    else {
        gLevel.MINES = 30;
        gLevel.ROWS = 12;
        gLevel.COLS = 12;
        gCurrentLevel = 3;
    }
    initGameData();
    init();
}
function init() {
    var smiley = document.querySelector('.user-bar img')
    smiley.src = 'img/happy.png'
    gBoard = buildBoard()
    renderBoard(gBoard)
    renderLives()
    if (gBestScoreEasy) document.querySelector('.easy').innerText = localStorage.Easy;
    if (gBestScoreMedium) document.querySelector('.medium').innerText = localStorage.Medium;
    if (gBestScoreHard) document.querySelector('.hard').innerText = localStorage.Hard;
    var elHints = document.querySelectorAll('.hints img')
    for (var i = 0; i < elHints.length; i++) {
        elHints[i].style.display = 'inline';
    }
}
function renderBoard(board) {
    var strHtml = '';
    for (var i = 0; i < board.length; i++) {
        var row = board[i];
        strHtml += '<tr>';
        for (var j = 0; j < row.length; j++) {
            var cell = '';
            if (gBoard[i][j].isMine) {
                var className = 'mine';
            }
            else {
                className = 'num'
            }
            var tdId = `cell-${i}-${j}`;

            strHtml += `<td id="${tdId}" class="${className}" 
                        oncontextmenu="cellMarked(this , this.id , event)"
                        onclick="cellClicked(this , this.id)">
                        ${cell}
                        </td>`
        }
        strHtml += '</tr>';
    }
    var elBoard = document.querySelector('.game-board');
    elBoard.innerHTML = strHtml;
}
function genMines() {
    var poses = [];
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (i != gStartPoint.i && j != gStartPoint.j) poses.push({ i: i, j: j })
        }
    }
    poses.sort(function (a, b) { return 0.5 - Math.random() });
    for (var i = 0; i < gLevel.MINES; i++) {
        var pos = poses.pop();
        gBoard[pos.i][pos.j].isMine = true;
    }
}
function cellClicked(elCell, location) {
    var pos = genCoords(location)
    if (gGame.isOn) {
        if (gClicks <= 0) {
            gStartPoint = pos;
            genMines();
            setMinesNegsCount()
            renderBoard(gBoard)
            gGameInterval = setInterval(displayTime, 1000)
        }
        gClicks++;
        if (gGame.isHintMode) {
            gHintInterval = setInterval(function () { hintMode(pos) })
            return;
        }
        var posOnBoard = gBoard[pos.i][pos.j]
        if (!posOnBoard.isShown && !posOnBoard.isMarked) {
            var value = posOnBoard.minesAroundCount
            if (!posOnBoard.isShown && !posOnBoard.isMine) {
                posOnBoard.isShown = true;
                ++gGame.shownCount
            }
            checkGameOver()
            //mine
            if (posOnBoard.isMine) {
                if (gGame.lives <= 1) { //if no more lives
                    clearInterval(gGameInterval);
                    gGame.lives--;
                    value = MINE;
                    gGame.isOn = false;
                    elCell.classList.add('died');
                    var smiley = document.querySelector('.user-bar img')
                    smiley.src = 'img/lose.png'
                    gFailSound.play();
                    renderLives();
                    var elMines = document.querySelectorAll('.mine');
                    for (var i = 0; i < elMines.length; i++) {
                        var minePos = genCoords(elMines[i].id)
                        renderCell(minePos, value)
                    }
                }
                else {
                    gGame.lives--;
                    renderLives()
                    return;
                }
            }
            //zero
            else if (!posOnBoard.minesAroundCount) {
                value = ' ';
                expandShown(pos)
            }
            // debugger
            var numColorClass;
            if (value === 1) numColorClass = 'one'
            if (value === 2) numColorClass = 'two'
            if (value === 3) numColorClass = 'three'
            if (value === 4) numColorClass = 'four'
            renderCell(pos, value);
            elCell.classList.add('shown');
            elCell.classList.add(numColorClass);
        }
    }
}
function cellMarked(elCell, location, event) {
    event.preventDefault();
    if (!gGameInterval) return;
    var pos = genCoords(location);
    var boardPose = gBoard[pos.i][pos.j]
    if (!boardPose.isShown) {
        if (!boardPose.isMarked) {
            gGame.markedCount++;
            boardPose.isMarked = true;
            renderCell(pos, FLAG)
            checkGameOver();
            elCell.classList.add('marked');
        }
        else {
            gGame.markedCount--;
            boardPose.isMarked = false;
            renderCell(pos, '')
            elCell.classList.remove('marked');
        }
    }
    return false;
}
function expandShown(pos) {
    var neighborsArr = [];
    for (var i = pos.i - 2; i <= pos.i + 2; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = pos.j - 2; j <= pos.j + 2; j++) {
            // if (i === pos.i && j === pos.j) continue;
            if (j < 0 || j >= gBoard[i].length) continue;
            if (gBoard[i][j].isMarked) continue;
            if (gBoard[i][j].isMine) continue;
            neighborsArr.push({ i: i, j: j });
        }
    }
    for (var i = 0; i < neighborsArr.length; i++) {
        var negsPose = gBoard[neighborsArr[i].i][neighborsArr[i].j]
        var negs = negsPose.minesAroundCount;
        if (negs === 0) negs = '';
        renderCell(neighborsArr[i], negs)
        if (!negsPose.isShown) {
            negsPose.isShown = true;
            ++gGame.shownCount
        }
        checkGameOver()
    }
    for (var i = 0; i < neighborsArr.length; i++) {
        var elI = neighborsArr[i].i;
        var elJ = neighborsArr[i].j;
        document.querySelector(`#cell-${elI}-${elJ}`).classList.add('shown');
        var numColorClass;
        if (negs === 1) numColorClass = 'one'
        if (negs === 2) numColorClass = 'two'
        if (negs === 3) numColorClass = 'three'
        if (negs === 4) numColorClass = 'four'
        else numColorClass = 'shown'
        document.querySelector(`#cell-${elI}-${elJ}`).classList.add(numColorClass);
    }
    return;
}
function checkGameOver() {
    var mines = gLevel.MINES;
    var cellsShown = gGame.shownCount;
    var cellsNum = gBoard.length * gBoard[0].length;
    if (cellsShown >= (cellsNum - mines) && gGame.markedCount === mines) {
        var smiley = document.querySelector('.user-bar img')
        smiley.src = 'img/win.png'
        clearInterval(gGameInterval);
        gGame.isOn = false;
        gScore = gGame.secsPassed;
        setScore(gScore);
        gWinSound.play();
    }
}
function renderLives() {
    var elLives = document.querySelector('.lives');
    var strHtml = ''
    for (var i = 0; i < gGame.lives; i++) {
        strHtml += ' <img src="img/life.png">'
    }
    elLives.innerHTML = strHtml;
}
function displayTime() {
    gGame.secsPassed++
    document.querySelector('h3').innerText = gGame.secsPassed;


}
function initGameData() {
    gGame.isOn = true;
    gGame.lives = 3;
    gGame.markedCount = 0;
    gGame.secsPassed = 0;
    gGame.shownCount = 0;
    gClicks = 0;
    gGame.isHintMode = false;
    gGame.hintsCount = 3;
    clearInterval(gGameInterval);
    displayTime();
}
function setScore(score) {
    if (gCurrentLevel === 1) {
        if (score < gBestScoreEasy || !gBestScoreEasy) gBestScoreEasy = score;
        localStorage.setItem("Easy", gBestScoreEasy);
        document.querySelector('.easy').innerText = localStorage.Easy;
    }
    if (gCurrentLevel === 2) {
        if (score < gBestScoreMedium || !gBestScoreMedium) gBestScoreMedium = score;
        localStorage.setItem("Medium", gBestScoreMedium);
        document.querySelector('.medium').innerText = localStorage.Medium;
    }
    if (gCurrentLevel === 3) {
        if (score < gBestScoreHard || !gBestScoreHard) gBestScoreHard = score;
        localStorage.setItem("Hard", gBestScoreHard);
        document.querySelector('.hard').innerText = localStorage.Hard;
    }
}
function enterHintsMode(elHint) {
    elHint.style.display = 'none';
    if (gGame.hintsCount > 0) {
        gGame.isHintMode = true;
        gGame.hintsCount--;
    }
}
function hintMode(pos) {
    //show neigbors
    for (var i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue;
            if (gBoard[i][j].isMarked) continue;
            var value = gBoard[i][j].minesAroundCount;
            if (gBoard[i][j].isMine) value = MINE
            renderCell({ i: i, j: j }, value)
        }
    }
    setTimeout(function () {
        gGame.isHintMode = false;
        //hide neighbors
        for (var i = pos.i - 1; i <= pos.i + 1; i++) {
            if (i < 0 || i >= gBoard.length) continue;
            for (var j = pos.j - 1; j <= pos.j + 1; j++) {
                if (j < 0 || j >= gBoard[i].length) continue;
                if (gBoard[i][j].isMarked) continue;
                renderCell({ i: i, j: j }, ' ')
            }
        }
        clearInterval(gHintInterval);
    }, 1000)
}
