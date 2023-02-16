

export type Cell = [number,number];
export class CellMap extends Map {
  
  constructor(entries?: readonly Cell[] | null) {
    // super(entries?.map((cell: Cell) => [this._hash(cell), cell]));
    super();
    if ( entries ) entries.forEach((cell) => this.set(cell));
  }
  override delete(value: Cell): boolean {
    return super.delete(this._hash(value));
  }
  override has(value: Cell): boolean {
    return super.has(this._hash(value));
  }
  override set(value: Cell): this {
    return super.set(this._hash(value), value);
  }
  /**
   * @param cell position
   * @returns {number} a probably unique number for this state
   */
  _hash(cell: Cell) {
    return ((cell[0] << 32) + cell[1]);
  }

}