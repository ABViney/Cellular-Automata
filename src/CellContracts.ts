import { Cell } from "./CellData";

/**
 * View -> Controller
 */
export interface UserRequest {
  toggle(cell: Cell): void;
  next(): Cell[];
  prev(): Cell[];
  reset(): void;
}

/**
 * Controller -> Model
 */
export interface DataOperation {
  update(options?: Partial<AutomataOptions>): Cell[];
  undo(): Cell[];
  clear(): void;
  toJSON(): string;
}

/**
 * System properties at a specific point in time
 */
export interface AutomataSystem {
  readonly state: Cell[];
  readonly old_states: Cell[][];
  readonly search_pattern: Cell[];
  readonly persists_at: number[];
  readonly populates_at: number[];
  readonly max_history?: number;
};

/**
 * Update properties for a system
 */
export interface AutomataOptions {
  readonly system: AutomataSystem;
  readonly cells: Cell[];
  readonly pattern: Cell[];
  readonly persists_at: number[];
  readonly populates_at: number[];
};