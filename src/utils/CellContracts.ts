import { Cell } from "./CellData";

/**
 * View -> Controller
 */
export interface UserRequest {
  // TODO: Swap System func
  next(options: AutomataOptions): Cell[];
  prev(): Cell[];
  reset(): Cell[];
}

/**
 * Controller -> Model
 */
export interface DataOperation {
  update(options?: Partial<AutomataOptions>): Cell[];
  undo(): Cell[];
  clear(): Cell[];
  statusOf(cell: Cell): boolean;
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
  system?: AutomataSystem;
  cells?: Cell[];
  pattern?: Cell[];
  persists_at?: number[];
  populates_at?: number[];
};