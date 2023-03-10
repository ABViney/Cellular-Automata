import { Cell, CellMap } from './CellData'
import { AutomataOptions, AutomataSystem, DataOperation } from './CellContracts';

export class CellModel implements DataOperation {
  
  /**
   * Current system state
   */
  private readonly _state = new CellMap();

  /**
   * Historical state stack
   */
  private _old_states: Cell[][] = new Array();

  /** Max state stack size */
  private _max_history: number = 25;

  /** Evaluation instructions */
  private _search_pattern: Cell[] = [];

  /** Number of neighbors needed to revive a dead cell */
  private _cell_populates_at: number[] = [];

  /** Number of neighbors needed to keep a cell living */
  private _cell_persists_at: number[] = [];

  /**
   * @param data initial system properties
   */
  constructor(system: AutomataSystem) {
    this._instantiateFromSystem(system);
  }

  /**
   * Rebuild this system to the passed definition
   * @param system 
   */
  private _instantiateFromSystem(system: AutomataSystem) {
    // Avoid altering the original object
    system = JSON.parse(JSON.stringify(system));
    
    this._setState(system.state);
    if ( system.old_states ) {
      if ( system.max_history && system.max_history >= 0 ) this._max_history = system.max_history;
      this._old_states = system.old_states;
      while ( this._old_states.length > this._max_history ) this._old_states.shift();
    }
    this._search_pattern = system.search_pattern;
    this._cell_persists_at = system.persists_at;
    this._cell_populates_at = system.populates_at;
  }

 

  /**
   * Shallow copy of the current state values
   * @returns {Cell[]}
   */
  private _cellData() { return Array.from(this._state.values()); }

  /**
   * @param cell position to evaluate
   * @param alive if position is alive
   * @returns {boolean} if this cell's state will change
   */
  private _cellWillChange(cell: Cell, alive: boolean) {
    let neighbor_count = 0;
    for ( const offset of this._search_pattern ) {
      const neighbor: Cell = [ cell[0] + offset[0], cell[1] + offset[1] ];
      if ( this._state.has(neighbor) ) neighbor_count++;
    }
    return !alive && this._cell_populates_at.includes(neighbor_count)
        || alive && !this._cell_persists_at.includes(neighbor_count);
  }

  /**
   * @param cells positions to toggle
   */
  private _toggleCells(cells: Cell[]) {
    for ( const cell of cells ) {
      this._state.toggle(cell);
    }
  }

  _updateHistory() {
    if ( this._old_states.length === this._max_history ) this._old_states.shift();
    this._old_states.push(Array.from(this._state.values()));
  }

  _nextState() {
    const used = new CellMap();
    const cells_to_update = [];

    // Evaluate every living cell
    for ( const cell of this._state.values() ) {
      const living_cell = cell;
      if ( used.has(cell) ) continue;
      used.set(cell);
      if ( this._cellWillChange(living_cell, true) ) cells_to_update.push(living_cell);

      // Evaluate neighbors affected by this living cell
      for ( const offset of this._search_pattern ) {
        const neighbor_cell: Cell = [
          living_cell[0] - offset[0],
          living_cell[1] - offset[1]
        ];
        if ( used.has(neighbor_cell) ) continue;
        used.set(neighbor_cell);
        if ( this._cellWillChange(neighbor_cell, this._state.has(neighbor_cell)) ) {
          cells_to_update.push(neighbor_cell);
        }
      }
    }
    this._updateHistory();
    this._toggleCells(cells_to_update);
    return this._cellData();
  }

  private _setState(state: Cell[]) {
    this._state.clear();
    this._toggleCells(state);
    return this._cellData();
  }

  private _lastState() {
    this._state.clear();
    this._toggleCells(this._old_states.pop() || []);
    return this._cellData();
  }

  private _setSearchPattern(search_pattern: Cell[]) {
    this._search_pattern = JSON.parse(JSON.stringify(search_pattern));
  }

  /**
   * Stringify this system
   * @returns System as string
   */
  public toJSON(): string {
    return JSON.stringify({
      state: Array.from(this._state.values()),
      old_states: this._old_states,
      search_pattern: this._search_pattern,
      persists_at: this._cell_persists_at,
      populates_at: this._cell_populates_at
    });
  }

  public statusOf(cell: Cell): boolean {
      return this._state.has(cell);
  }

  /**
   * Update system and return the new state.
   * @param options
   */
  public update(options?: Partial<AutomataOptions>) {
    if ( options ) {
      if ( options.system ) {
        this._instantiateFromSystem(options.system);
        return this._cellData();
      }
      if ( options.cells ) {
        this._updateHistory();
        this._toggleCells(options.cells);
      }
      if ( options.pattern ) this._setSearchPattern(options.pattern);
      if ( options.persists_at ) this._cell_persists_at = options.persists_at;
      if ( options.populates_at ) this._cell_populates_at = options.populates_at;
    }
    this._updateHistory();
    return this._nextState();
  }

  /**
   * @returns the previous state
   */
  public undo() {
    return this._lastState();
  }

  /**
   * @returns An empty array
   */
  public clear() {
    this._updateHistory();
    return this._setState([]);
  }
}