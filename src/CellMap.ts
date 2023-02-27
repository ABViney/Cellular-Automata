

export type Cell = [number,number];
export class CellMap {
  
  private _map:Map<number, Cell>;

  constructor(entries?: readonly Cell[] | null) {
    this._map = new Map<number, Cell>();
    if ( entries ) entries.forEach((cell) => this.set(cell));
  }
  
  public delete(value: Cell): boolean {
    return this._map.delete(this._hash(value));
  }
  
  public has(value: Cell): boolean {
    return this._map.has(this._hash(value));
  }
  
  public set(value: Cell): this {
    this._map.set(this._hash(value), value);
    return this;
  }

  public values(): Iterable<Cell> {
    return this._map.values();
  }
  /**
   * @param cell position
   * @returns {number} a probably unique number for this state
   */
  _hash(cell: Cell):number {
    return ((cell[0] << 32) + cell[1]);
  }

}