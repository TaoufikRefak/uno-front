import React from "react";
import Card from "../Card/Card";
import "./DiscardPile.css";

function DiscardPile({ topCard }) {
  return (
    <div className="discard-pile">
      <h3>Discard Pile</h3>
      <div className="pile-content">
        {topCard ? (
          <Card card={topCard} />
        ) : (
          <div className="empty-pile">No cards yet</div>
        )}
      </div>
    </div>
  );
}

export default DiscardPile;
