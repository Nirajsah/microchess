import { ArrowLeft, ArrowRight } from "lucide-react";
import { Color, PieceColor } from "./types";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { assignChain, friendId, reqFriendlyGame } from "@/api";
import MatchSelect from "./MatchSelect";
import MatchDataUI from "./MatchData";

export interface MatchData {
  player: PieceColor | "-";
  color?: Color;
  moves: { white: string; black: string }[];
  capturedPieces: string[];
  checkStatus: string;
  opponentId: string | null;
  game_state: string;
  timer: {
    white: number;
    black: number;
  };
  assign?: {
    chainId: string;
    timestamp: number;
  };
}

export const RightSideMenu: React.FC<MatchData> = (matchData: MatchData) => {
  const [hash, setHash] = React.useState("");
  React.useEffect(() => {
    (async () => {
      const res = await friendId();
      const check = JSON.parse(res.result).data.friendId;
      setHash(check);
      console.log(check);
    })();
  }, []);

  return (
    <div className="h-full w-full">
      {matchData.color === "White" || matchData.color === "Black" ? (
        <MatchDataUI {...matchData} />
      ) : (
        <MatchSelect
          assign={matchData.assign}
          hash={hash}
          joinFriendlyGame={() => {}}
        />
      )}
    </div>
  );
};

type MatchMakingButtonType = {
  handleMatchMaking: () => void;
  name: string;
  icon: any;
};

interface AssignButtonProps {
  name: string;
  icon: JSX.Element;
  chainId: string;
  timestamp: number;
}

const AssignButton: React.FC<AssignButtonProps> = ({
  name,
  icon,
  chainId,
  timestamp,
}) => {
  const [pressed, setPressed] = useState(false);

  function handleClick() {
    setPressed(true);
    assignChain(chainId, timestamp);
    setTimeout(() => setPressed(false), 120); // revert after 120ms
  }

  return (
    <div className="relative w-full h-[80px]">
      <div className="w-full h-full bg-[#ffffff24] shadow-inner"></div>
      <button
        onClick={handleClick}
        style={{
          top: pressed ? "0px" : "-4px",
          left: pressed ? "0px" : "-4px",
        }}
        className="absolute bg-[#0a0a0a] border border-[#ffffff24] w-full h-full transition-all flex justify-center items-center gap-3 px-6 py-4"
      >
        {icon}
        <div className="text-left">
          <div className="font-semibold text-lg">{name}</div>
        </div>
      </button>
    </div>
  );
};

const MatchButton = (props: MatchMakingButtonType) => {
  const [pressed, setPressed] = useState(false);

  function handleClick() {
    setPressed(true);
    props.handleMatchMaking();
    setTimeout(() => setPressed(false), 120); // revert after 120ms
  }

  return (
    <div className="relative w-full h-[80px]">
      <div className="w-full h-full bg-[#ffffff24] shadow-inner"></div>
      <button
        onClick={handleClick}
        style={{
          top: pressed ? "0px" : "-4px",
          left: pressed ? "0px" : "-4px",
        }}
        className="absolute bg-[#0a0a0a] border border-[#ffffff24] w-full h-full transition-all flex justify-center items-center gap-3 px-6 py-4"
      >
        {props.icon}
        <div className="text-left">
          <div className="font-semibold text-lg">{props.name}</div>
        </div>
      </button>
    </div>
  );
};

//
const JoinMatch = ({ handleStepChange }: { handleStepChange: any }) => {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState("");

  useEffect(() => {
    const incoming = searchParams.get("gamehash");
    if (incoming) setCode(incoming.toUpperCase());
  }, [searchParams]);

  const handleJoin = () => {
    if (!code) return alert("Please enter a code.");
    // logic to join the game
    alert(`Joining game with code: ${code}`);
  };

  return (
    <div>
      <button
        onClick={() => handleStepChange("idle")}
        className="self-start text-sm flex items-center gap-2 hover:scale-110 transition-all"
      >
        <ArrowLeft className="ml-2 w-4 h-4" />
        Go Back
      </button>
      <h2 className="text-xl font-bold m-4 text-center">
        Join a Friend’s Game
      </h2>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Enter match code"
        className="w-full px-4 py-2 rounded-lg bg-[#0a0a0a] border border-[#ffffff24] text-white mb-4 outline-none"
      />
      <button
        onClick={handleJoin}
        className="flex bg-[#0a0a0a] border border-[#ffffff24] items-center justify-center w-full px-4 py-2 hover:bg-[#111111] rounded-lg transition"
      >
        Join Game <ArrowRight className="ml-2 w-4 h-4" />
      </button>
    </div>
  );
};
