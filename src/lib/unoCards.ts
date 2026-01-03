// UNO Card Types and Game Logic

export type CardColor = 'red' | 'blue' | 'green' | 'yellow';
export type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | 'draw2';
export type WildCardValue = 'wild' | 'wild_draw4';

export interface Card {
  id: string;
  color: CardColor | 'black';
  value: CardValue | WildCardValue;
}

export interface Player {
  id: string;
  name: string;
  isAI: boolean;
  hand: Card[];
  hasCalledUno: boolean;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  drawPile: Card[];
  discardPile: Card[];
  currentColor: CardColor;
  winner: Player | null;
  gameOver: boolean;
}

// Create a full UNO deck
export function createDeck(): Card[] {
  const deck: Card[] = [];
  const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];
  
  let cardId = 0;
  
  // Add number cards (0-9 for each color, one 0 and two of each 1-9)
  for (const color of colors) {
    // One 0 card
    deck.push({ id: `card_${cardId++}`, color, value: '0' });
    
    // Two of each 1-9
    for (let num = 1; num <= 9; num++) {
      deck.push({ id: `card_${cardId++}`, color, value: num.toString() as CardValue });
      deck.push({ id: `card_${cardId++}`, color, value: num.toString() as CardValue });
    }
    
    // Two of each action card
    deck.push({ id: `card_${cardId++}`, color, value: 'skip' });
    deck.push({ id: `card_${cardId++}`, color, value: 'skip' });
    deck.push({ id: `card_${cardId++}`, color, value: 'reverse' });
    deck.push({ id: `card_${cardId++}`, color, value: 'reverse' });
    deck.push({ id: `card_${cardId++}`, color, value: 'draw2' });
    deck.push({ id: `card_${cardId++}`, color, value: 'draw2' });
  }
  
  // Add wild cards (4 of each)
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `card_${cardId++}`, color: 'black', value: 'wild' });
    deck.push({ id: `card_${cardId++}`, color: 'black', value: 'wild_draw4' });
  }
  
  return deck;
}

// Shuffle array using Fisher-Yates algorithm
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal cards to players
export function dealCards(deck: Card[], numPlayers: number, cardsPerPlayer: number = 7): { hands: Card[][]; remainingDeck: Card[] } {
  const shuffledDeck = shuffle(deck);
  const hands: Card[][] = [];
  
  for (let i = 0; i < numPlayers; i++) {
    hands.push(shuffledDeck.splice(0, cardsPerPlayer));
  }
  
  return { hands, remainingDeck: shuffledDeck };
}

// Check if a card can be played on the discard pile
export function canPlayCard(card: Card, topCard: Card, currentColor: CardColor): boolean {
  // Wild cards can always be played
  if (card.color === 'black') {
    return true;
  }
  
  // Match by color
  if (card.color === currentColor) {
    return true;
  }
  
  // Match by value (if top card is not wild)
  if (topCard.color !== 'black' && card.value === topCard.value) {
    return true;
  }
  
  return false;
}

// Get playable cards from a hand
export function getPlayableCards(hand: Card[], topCard: Card, currentColor: CardColor): Card[] {
  return hand.filter(card => canPlayCard(card, topCard, currentColor));
}

// Initialize a new game
export function initializeGame(playerNames: string[], aiCount: number): GameState {
  const deck = createDeck();
  const totalPlayers = 1 + aiCount; // 1 human + AI players
  
  const { hands, remainingDeck } = dealCards(deck, totalPlayers);
  
  const players: Player[] = [
    {
      id: 'human',
      name: playerNames[0] || 'You',
      isAI: false,
      hand: hands[0],
      hasCalledUno: false,
    },
    ...Array.from({ length: aiCount }, (_, i) => ({
      id: `ai_${i + 1}`,
      name: `Bot ${i + 1}`,
      isAI: true,
      hand: hands[i + 1],
      hasCalledUno: false,
    })),
  ];
  
  // Find a non-wild card to start
  let startingCardIndex = remainingDeck.findIndex(c => c.color !== 'black');
  if (startingCardIndex === -1) startingCardIndex = 0;
  
  const startingCard = remainingDeck.splice(startingCardIndex, 1)[0];
  
  return {
    players,
    currentPlayerIndex: 0,
    direction: 1,
    drawPile: remainingDeck,
    discardPile: [startingCard],
    currentColor: startingCard.color as CardColor,
    winner: null,
    gameOver: false,
  };
}

// Get the next player index
export function getNextPlayerIndex(state: GameState): number {
  const numPlayers = state.players.length;
  let next = state.currentPlayerIndex + state.direction;
  
  if (next >= numPlayers) next = 0;
  if (next < 0) next = numPlayers - 1;
  
  return next;
}

// Play a card
export function playCard(
  state: GameState,
  playerIndex: number,
  card: Card,
  chosenColor?: CardColor
): GameState {
  const player = state.players[playerIndex];
  const cardIndex = player.hand.findIndex(c => c.id === card.id);
  
  if (cardIndex === -1) return state;
  
  // Remove card from hand
  const newHand = [...player.hand];
  newHand.splice(cardIndex, 1);
  
  const newPlayers = [...state.players];
  newPlayers[playerIndex] = {
    ...player,
    hand: newHand,
    hasCalledUno: newHand.length === 1 ? player.hasCalledUno : false,
  };
  
  // Add card to discard pile
  const newDiscardPile = [...state.discardPile, card];
  
  // Determine new color
  let newColor: CardColor = card.color === 'black' 
    ? (chosenColor || 'red') 
    : card.color as CardColor;
  
  let newDirection = state.direction;
  let skipNext = false;
  let drawAmount = 0;
  
  // Handle special cards
  switch (card.value) {
    case 'reverse':
      newDirection = (state.direction * -1) as 1 | -1;
      if (state.players.length === 2) skipNext = true; // In 2-player, reverse acts as skip
      break;
    case 'skip':
      skipNext = true;
      break;
    case 'draw2':
      drawAmount = 2;
      skipNext = true;
      break;
    case 'wild_draw4':
      drawAmount = 4;
      skipNext = true;
      break;
  }
  
  // Calculate next player
  let newState: GameState = {
    ...state,
    players: newPlayers,
    discardPile: newDiscardPile,
    currentColor: newColor,
    direction: newDirection,
  };
  
  let nextIndex = getNextPlayerIndex(newState);
  
  // Handle draw cards
  if (drawAmount > 0) {
    const targetPlayer = newPlayers[nextIndex];
    let newDrawPile = [...state.drawPile];
    const drawnCards: Card[] = [];
    
    for (let i = 0; i < drawAmount; i++) {
      if (newDrawPile.length === 0) {
        // Reshuffle discard pile (except top card)
        const topCard = newDiscardPile.pop()!;
        newDrawPile = shuffle(newDiscardPile);
        newDiscardPile.length = 0;
        newDiscardPile.push(topCard);
      }
      if (newDrawPile.length > 0) {
        drawnCards.push(newDrawPile.pop()!);
      }
    }
    
    newPlayers[nextIndex] = {
      ...targetPlayer,
      hand: [...targetPlayer.hand, ...drawnCards],
    };
    
    newState.players = newPlayers;
    newState.drawPile = newDrawPile;
    newState.discardPile = newDiscardPile;
  }
  
  // Skip if needed
  if (skipNext) {
    nextIndex = getNextPlayerIndex({ ...newState, currentPlayerIndex: nextIndex });
  }
  
  newState.currentPlayerIndex = nextIndex;
  
  // Check for winner
  if (newHand.length === 0) {
    newState.winner = newPlayers[playerIndex];
    newState.gameOver = true;
  }
  
  return newState;
}

// Draw a card for a player
export function drawCard(state: GameState, playerIndex: number): GameState {
  if (state.drawPile.length === 0 && state.discardPile.length <= 1) {
    // No cards to draw, skip turn
    return {
      ...state,
      currentPlayerIndex: getNextPlayerIndex(state),
    };
  }
  
  let newDrawPile = [...state.drawPile];
  let newDiscardPile = [...state.discardPile];
  
  if (newDrawPile.length === 0) {
    // Reshuffle discard pile (except top card)
    const topCard = newDiscardPile.pop()!;
    newDrawPile = shuffle(newDiscardPile);
    newDiscardPile = [topCard];
  }
  
  const drawnCard = newDrawPile.pop()!;
  const player = state.players[playerIndex];
  
  const newPlayers = [...state.players];
  newPlayers[playerIndex] = {
    ...player,
    hand: [...player.hand, drawnCard],
    hasCalledUno: false,
  };
  
  return {
    ...state,
    players: newPlayers,
    drawPile: newDrawPile,
    discardPile: newDiscardPile,
    currentPlayerIndex: getNextPlayerIndex(state),
  };
}

// AI decision making
export function getAIMove(state: GameState, playerIndex: number): { action: 'play' | 'draw'; card?: Card; chosenColor?: CardColor } {
  const player = state.players[playerIndex];
  const topCard = state.discardPile[state.discardPile.length - 1];
  const playableCards = getPlayableCards(player.hand, topCard, state.currentColor);
  
  if (playableCards.length === 0) {
    return { action: 'draw' };
  }
  
  // Simple AI: play the first playable card
  // Prefer non-wild cards, then special cards
  const nonWildCards = playableCards.filter(c => c.color !== 'black');
  const specialCards = nonWildCards.filter(c => ['skip', 'reverse', 'draw2'].includes(c.value));
  const numberCards = nonWildCards.filter(c => !['skip', 'reverse', 'draw2'].includes(c.value));
  
  let cardToPlay: Card;
  
  if (numberCards.length > 0) {
    cardToPlay = numberCards[0];
  } else if (specialCards.length > 0) {
    cardToPlay = specialCards[0];
  } else {
    cardToPlay = playableCards[0];
  }
  
  // Choose color for wild cards (most common color in hand)
  let chosenColor: CardColor | undefined;
  if (cardToPlay.color === 'black') {
    const colorCounts: Record<CardColor, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
    player.hand.forEach(c => {
      if (c.color !== 'black') {
        colorCounts[c.color as CardColor]++;
      }
    });
    chosenColor = (Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as CardColor) || 'red';
  }
  
  return { action: 'play', card: cardToPlay, chosenColor };
}

// Get card display value
export function getCardDisplayValue(card: Card): string {
  switch (card.value) {
    case 'skip': return '⊘';
    case 'reverse': return '⟳';
    case 'draw2': return '+2';
    case 'wild': return '★';
    case 'wild_draw4': return '+4';
    default: return card.value;
  }
}

// Get card background color class
export function getCardColorClass(color: Card['color']): string {
  switch (color) {
    case 'red': return 'bg-uno-red';
    case 'blue': return 'bg-uno-blue';
    case 'green': return 'bg-uno-green';
    case 'yellow': return 'bg-uno-yellow';
    case 'black': return 'bg-gray-900';
    default: return 'bg-gray-500';
  }
}
