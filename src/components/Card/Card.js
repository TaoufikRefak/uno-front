import "./Card.css";

function Card({ card, onClick, isPlayable = false, isSelected = false }) {
  const getCardClass = () => {
    let className = "card";

    // Add color class
    if (card.color) {
      className += ` card-${card.color}`;
    }

    // Add type class for special cards
    if (card.type !== "number") {
      className += ` card-${card.type}`;
    }

    if (isPlayable) {
      className += " card-playable";
    }

    if (isSelected) {
      className += " card-selected";
    }

    return className;
  };

  const getCardContent = () => {
    if (card.type === "number") {
      return card.value; // Handle both value and number properties
    }

    switch (card.type) {
      case "skip":
        return "🚫";
      case "reverse":
        return "🔄";
      case "draw_two":
        return "+2";
      case "wild":
        return "W";
      case "wild_draw_four":
        return "W+4";
      default:
        return card.type;
    }
  };

  return (
    <div className={getCardClass()} onClick={onClick}>
      <div className="card-content">{getCardContent()}</div>
      {/* Show the number in the corner for number cards */}
      {card.type === "number" && (
        <div className="card-corner">{card.value}</div>
      )}
      {card.type === "reverse" && <div className="card-corner">R</div>}
    </div>
  );
}

export default Card;
