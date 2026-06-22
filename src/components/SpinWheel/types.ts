/* ============================================================
   SpinWheel — shared types. Explicit interfaces per CODE_RULES.md §1.
   ============================================================ */

/**
 * A player rendered on one wheel segment.
 * `avatarUri` comes from the existing avatar/profile system (resolved by the
 * screen/service layer, not by the wheel). When null, the wheel renders a
 * gradient + initials fallback.
 */
export interface WheelPlayer {
  id: string;
  name: string;
  avatarUri: string | null;
}

/** Result returned by the authoritative spin RPC (CODE_RULES.md §10). */
export interface SpinOutcome {
  winnerIndex: number;
}

export interface SpinWheelProps {
  /** Real joined players, 2–6. Order defines segment order. */
  players: WheelPlayer[];
  /**
   * Asks the server for the authoritative winner and resolves with the index
   * into `players`. The wheel animates to land on this index. MUST be backed
   * by a Supabase RPC — the client never decides the winner.
   */
  requestWinner: () => Promise<number>;
  /** Fired on every segment-boundary crossing during the spin (drives tick SFX). */
  onTick: () => void;
  /** Fired once when the spin animation finishes (drives the win chime). */
  onWin: () => void;
  /** Fired when ticks should stop (silence before result). */
  onTickStop?: () => void;
  /** Fired with the winner index after the result is shown. */
  onResult?: (winnerIndex: number) => void;
  /** Display size of the wheel square in px. Defaults to 344. */
  size?: number;
}

export interface WheelFaceProps {
  players: WheelPlayer[];
  /** SVG square edge length in px. */
  size: number;
}

export interface ConfettiProps {
  /** Toggle a fresh burst by changing this key. */
  burstKey: number;
  width: number;
  height: number;
  /** Origin of the burst, 0–1 of width/height. */
  originX?: number;
  originY?: number;
}

export interface WinnerModalProps {
  visible: boolean;
  winner: WheelPlayer | null;
  onSpinAgain: () => void;
  onClose: () => void;
}
