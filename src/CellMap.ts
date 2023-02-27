

export type Cell = [number,number];
export class CellMap {
  
  private _map:Map<number, Cell>;

  constructor(entries?: readonly Cell[] | null) {
    this._map = new Map<number, Cell>();
    if ( entries ) entries.forEach((cell) => this.set(cell));
  }
  
  public delete(value: Cell): boolean {
    return this._map.delete(CellMap.hash(value));
  }
  
  public has(value: Cell): boolean {
    return this._map.has(CellMap.hash(value));
  }
  
  public set(value: Cell): this {
    this._map.set(CellMap.hash(value), value);
    return this;
  }

  public values(): Iterable<Cell> {
    return this._map.values();
  }

  public clear():void {
    this._map.clear();
  }
  
  public toggle(cell:Cell) {
    const key = CellMap.hash(cell);
    if (! this._map.delete(key) ) {
      this._map.set(key, cell);
    }
  }

  /**
   * @param cell position
   * @returns {number} a probably unique number for this state
   */
  static hash(cell: Cell):number {
    const [x,y] = cell;
    const xx = x >= 0 ? x * 2 : x * -2 - 1;
    const yy = y >= 0 ? y * 2 : y * -2 - 1;
    return (xx >= yy) ? (xx * xx + xx + yy) : (yy * yy + xx);
  }

}