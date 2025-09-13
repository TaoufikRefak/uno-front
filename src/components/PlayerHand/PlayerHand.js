import React, { useState } from "react";
import Card from "../Card/Card";
import "./PlayerHand.css";

function PlayerHand({ cards, onPlayCard, topCard }) {
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Make sure cards is always an array
  const safeCards = Array.isArray(cards) ? cards : [];

  const handleCardClick = (index, card) => {
    // Check if the card is playable
    const isPlayable = !topCard || isCardPlayable(card, topCard);

    if (!isPlayable) return;

    if (card.type === "wild" || card.type === "wild_draw_four") {
      setSelectedCardIndex(index);
      setShowColorPicker(true);
    } else {
      setSelectedCardIndex(index);
      onPlayCard(index);
    }
  };

  const handleColorSelect = (color) => {
    if (selectedCardIndex !== null) {
      onPlayCard(selectedCardIndex, color);
      setShowColorPicker(false);
      setSelectedCardIndex(null);
    }
  };

  const isCardPlayable = (card, topCard) => {
    if (!topCard) return true;

    // Wild cards can always be played
    if (card.type === "wild" || card.type === "wild_draw_four") return true;

    // Same color cards can always be played
    if (card.color === topCard.color) return true;

    // Same type handling
    if (card.type === topCard.type) {
      // For number cards, values must match
      if (card.type === "number") {
        return card.value === topCard.value;
      }
      // For other cards, same type is sufficient
      return true;
    }

    return false;
  };

  const getPlayableCards = () => {
    if (!topCard) return safeCards.map(() => true);

    return safeCards.map((card) => isCardPlayable(card, topCard));
  };

  const playableCards = getPlayableCards();

  return (
    <div className="player-hand">
      <h3>Your Hand ({safeCards.length} cards)</h3>

      {showColorPicker && (
        <div className="color-picker-overlay">
          <div className="color-picker">
            <h4>Choose a color:</h4>
            <div className="color-options">
              <button
                className="color-option red"
                onClick={() => handleColorSelect("red")}
              >
                Red
              </button>
              <button
                className="color-option blue"
                onClick={() => handleColorSelect("blue")}
              >
                Blue
              </button>
              <button
                className="color-option green"
                onClick={() => handleColorSelect("green")}
              >
                Green
              </button>
              <button
                className="color-option yellow"
                onClick={() => handleColorSelect("yellow")}
              >
                Yellow
              </button>
            </div>
            <button
              className="cancel-button"
              onClick={() => setShowColorPicker(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="cards-container">
        {safeCards.map((card, index) => (
          <Card
            key={index}
            card={card}
            isPlayable={playableCards[index]}
            isSelected={selectedCardIndex === index}
            onClick={() => handleCardClick(index, card)}
          />
        ))}
      </div>
    </div>
  );
}

export default PlayerHand;
