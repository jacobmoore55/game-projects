console.log("Hi, Welcome to BlackJack")

let cardsInPlay = [];
const cardSuits = ['clubs', 'diamonds', 'hearts', 'spades'];
const faceCardTypes = ['jack', 'queen', 'king'];

class Card {
    constructor(cardNum, cardSuit) {
    this.cardNum = cardNum;
    this.cardSuit = cardSuit;
    this.image = getCardImage(cardNum, cardSuit);
    }
}

class Hand {
    constructor(Card1, Card2) {
        this.cards = [Card1, Card2];
        this.count = this.total();
    }
    total() {
        let sum = 0;
        let numAces = 0;
        for (let i=0; i<this.cards.length; i++) {
            if (this.cards[i].cardNum === 1) {
                numAces++;
                continue;
            } else if (this.cards[i].cardNum >= 11) {
                sum += 10;
            }
            else {
                sum += this.cards[i].cardNum
            }
        }
        if (numAces > 0) {
            if (sum + numAces <= 11) {
                sum += 10 + numAces;
            } else {
                sum += numAces;
            }
        }
        if (sum > 21) {
            sum = "BUST";
        }
        return sum;
    }
}

function drawCard() {
    cardInPlay = true;
    while (cardInPlay) {
        cardNum = Math.floor(Math.random()*13)+1;
        cardSuit = Math.floor(Math.random()*4);
        if (cardsInPlay.length === 52) {
            return 0
        }
        cardFound = false;
        for (let i=0; i<cardsInPlay.length; i++) {
            if (cardNum === cardsInPlay[i][0] && 
                cardSuit === cardsInPlay[i][1]) {
                    cardFound = true;
                    break;
                }
        }
        if (!cardFound) {
            cardInPlay = false;
            cardsInPlay.push([cardNum, cardSuit]);
        }
    }
    return new Card(cardNum, cardSuit);
}

function getCardImage(cardNum, cardSuit) {
    cardSuit = cardSuits[cardSuit];
    if (cardNum === 1) {
        cardNum = 'ace';
    } else if (cardNum >= 11) {
        cardNum = faceCardTypes[cardNum-11];
        cardSuit = cardSuit + "2";
    }
    return cardNum + "_of_" + cardSuit + ".png";
}

// Game starts
const baseChipAmount = 1000.;
let chips = baseChipAmount;
let cardElement = document.createElement('img');
let gameButton = document.createElement('button');
let gameElements = document.getElementById('game-elements');
let gameMessage = document.getElementById('game-message');
let dealerTotal = document.getElementById('dealer-total');
let playerTotal = document.getElementById('player-total');

function displayChips(chipAmount) {
    document.getElementById('chip-amount').innerText = 'Chips: ' + chipAmount;
}

displayChips(chips);

function checkBet(betAmount) {
    gameElements.innerHTML = '';
    if (betAmount > chips || betAmount <= 0) {
        gameElements.style.color = "red";
        gameElements.innerText = "Invalid Entry";
        document.body.appendChild(gameElements);
        return 0;
    }
    chips = chips - betAmount;
    displayChips(chips);
    document.getElementById('bet-button').style.display = 'none';
    game(betAmount);
}

function displayPlayerHand(hand) {
    document.getElementById("player-hand").innerHTML = '';
    for (let i=0; i<hand.cards.length; i++) {
        cardElement = document.createElement('img');
        cardElement.src = "Playing Cards/PNG-cards-1.3/" + hand.cards[i].image;
        cardElement.className = 'card';
        //cardElement.style.marginRight = '10px';
        document.getElementById("player-hand").appendChild(cardElement);
    }
}

function displayPartialHand(hand) {
    cardElement = document.createElement('img');
    cardElement.src = "Playing Cards/PNG-cards-1.3/" + hand.cards[0].image;
    cardElement.className = 'card';
    document.getElementById("dealer-hand").appendChild(cardElement);
    cardElement = document.createElement('img');
    cardElement.src = "Playing Cards/PNG-cards-1.3/back_of_card.jpeg";
    cardElement.className = 'back-card';
    document.getElementById("dealer-hand").appendChild(cardElement);
}

function displayFullHand(hand) {
    document.getElementById("dealer-hand").innerHTML = '';
    for (let i=0; i<hand.cards.length; i++) {
        cardElement = document.createElement('img');
        cardElement.src = "Playing Cards/PNG-cards-1.3/" + hand.cards[i].image;
        cardElement.className = 'card';
        document.getElementById("dealer-hand").appendChild(cardElement);
    }
}

function playAgain() {
    document.getElementById('bet-button').style.display = 'inline-block';
    document.getElementById("dealer-hand").innerHTML = '';
    document.getElementById("player-hand").innerHTML = '';
    gameElements.innerHTML = '';
    gameMessage.innerText = '';
    cardsInPlay.splice(0, cardsInPlay.length);
    cardsInPlay = [];
    displayChips(chips);
    dealerTotal.innerText = '';
    playerTotal.innerText = '';
}

function reset() {
    chips = baseChipAmount;
    playAgain();
}

function hit(hand) {
    hand.cards.push(drawCard());
    displayPlayerHand(playerHand)
}

function displayTotals(playerHand, dealerHand) {
    dealerTotal.innerText = "Total: " + dealerHand.total();
    playerTotal.innerText = "Total: " + playerHand.total();
}

function renderButtons(gameOver, playerHand, dealerHand, betAmount=0, displayDD=false) {
    gameElements.innerHTML = '';
    if (gameOver) {
        displayTotals(playerHand, dealerHand);
        gameButton = document.createElement('button');
        gameButton.innerText = "Play Again";
        gameButton.onclick = playAgain;
        gameElements.appendChild(gameButton);
    } else {
        gameButton = document.createElement('button');
        gameButton.innerText = "Double Down";
        gameButton.addEventListener("click", function() {
            chips -= betAmount;
            displayChips(chips);
            betAmount *= 2;
            hit(playerHand);
            if (playerHand.total() === "BUST") {
                displayFullHand(dealerHand);
                gameMessage.innerText = 'You Busted';
                renderButtons(true, playerHand, dealerHand);
            }
            dealerTurn(playerHand, dealerHand, betAmount);
        });
        if (displayDD && betAmount <= chips) {
            gameElements.appendChild(gameButton);
        }
        gameButton = document.createElement('button');
        gameButton.innerText = "Hit";
        gameButton.addEventListener("click", function() {
            hit(playerHand);
            if (playerHand.total() === "BUST") {
                displayFullHand(dealerHand);
                gameMessage.innerText = 'You Busted';
                renderButtons(true, playerHand, dealerHand);
            } else {
                renderButtons(false, playerHand, dealerHand, betAmount);
            }
        });
        gameElements.appendChild(gameButton);
        gameButton = document.createElement('button');
        gameButton.innerText = "Stand";
        gameButton.addEventListener("click", function() {
            dealerTurn(playerHand, dealerHand, betAmount);
        });
        gameElements.appendChild(gameButton);
    }
    gameButton = document.createElement('button');
    gameButton.innerText = "Reset";
    //gameButton.addEventListener("click", reset);
    gameButton.onclick = reset;
    gameElements.appendChild(gameButton);
}

async function dealerTurn(playerHand, dealerHand, betAmount) {
    gameElements.innerHTML = '';
    displayFullHand(dealerHand);
    while (dealerHand.total() < playerHand.total() &&
        dealerHand.total() !== "BUST") {
        await new Promise(r => setTimeout(r, 1000));
        if (dealerHand.total() < playerHand.total() ||
            dealerHand.total() <= 15) {
            hit(dealerHand);
            displayFullHand(dealerHand);
        }
    }
    if (dealerHand.total() === "BUST" ||
    playerHand.total() > dealerHand.total()) {
        chips += betAmount * 2;
        displayChips(chips);
        gameMessage.innerText = "Player wins!";
    } else if (dealerHand.total() === playerHand.total()) {
        chips += betAmount * 1.0;
        displayChips(chips);
        gameMessage.innerText = "Draw.";
    } else {
        gameMessage.innerText = "Dealer wins."
    }
    renderButtons(true, playerHand, dealerHand);
}

function game(betAmount) {
    playerHand = new Hand(drawCard(), drawCard());
    dealerHand = new Hand(drawCard(), drawCard());
    displayPartialHand(dealerHand);
    displayPlayerHand(playerHand);
    if (playerHand.count === 21 && dealerHand.count < 21) {
        chips += betAmount * 2.5;
        displayChips(chips);
        displayFullHand(dealerHand);
        renderButtons(true, playerHand, dealerHand);
        gameMessage.innerText = "You got a Black Jack!!";
    } else if (playerHand.count === 21 && dealerHand.count === 21) {
        chips += betAmount;
        displayChips(chips);
        displayFullHand(dealerHand);
        renderButtons(true, playerHand, dealerHand);
        gameMessage.innerText = "You both got a Black Jack.";
    } else if (playerHand.count < 21 && dealerHand.count === 21) {
        displayFullHand(dealerHand);
        renderButtons(true, playerHand, dealerHand);
        gameMessage.innerText = "Dealer got a Black Jack.";
    } else {
        renderButtons(false, playerHand, dealerHand, betAmount, true);
    }
}






