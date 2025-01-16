import React from "react";
import { Piece, Square, SquareToPieceMap } from "./types";
import generatePossibleMoves from "./GeneratePossibleMoves";

export default function Tile({
  image,
  piece,
  square,
  setSelectedSquare,
  setPossMoves,
  board,
}: {
  image: string | undefined;
  piece: Piece | undefined;
  square: Square;
  setSelectedSquare: React.Dispatch<React.SetStateAction<Square | null>>;
  setPossMoves: React.Dispatch<React.SetStateAction<Square[]>>;
  board: SquareToPieceMap;
}) {
  const tileRef = React.useRef<HTMLDivElement>(null);

  const dragNdrop = parseInt(sessionStorage.getItem("dragNdrop") ?? "0", 10);
  const isDraggable = Boolean(dragNdrop);

  const [isDragging, setIsDragging] = React.useState(false);

  const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${piece}`);
    setSelectedSquare(square);
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = "0";
    }, 0.0);
    if (tileRef.current) {
      tileRef.current.getBoundingClientRect();
    }
    const moves = generatePossibleMoves(piece as Piece, square, board);
    setPossMoves(moves);
  };

  const onDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (tileRef.current) {
      tileRef.current.style.opacity = "1";
    }
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = "1";
    }, 10);
    setIsDragging(false);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    if (tileRef.current && isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      ref={tileRef}
      className={`flex items-center justify-center hover:scale-110 chess-piece transition-all duration-200 ${piece}`}
      style={{
        maxWidth: "50%",
        maxHeight: "50%",
        cursor: isDragging ? "grabbing" : "grab", // change the cursor to a grabbing hand
        opacity: 1,
      }}
      draggable={isDraggable}
      onDragStart={(e) => {
        onDragStart(e);
      }}
      onDragEnd={(e) => {
        onDragEnd(e);
      }}
      onDrag={handleDrag}
    >
      {image && (
        <div className="w-full" draggable={isDraggable}>
          <img
            style={{
              maxWidth: "100%", // Keep the image size consistent
              maxHeight: "100%",
              objectFit: "contain",
              opacity: 1,
              backgroundColor: "transparent",
            }}
            src={image}
            alt={image}
            draggable="false"
          />
        </div>
      )}
    </div>
  );
}
