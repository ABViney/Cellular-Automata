import { Application, Renderer } from "pixi.js";
import { AutomataOptions, UserRequest } from "./CellContracts";
import { Cell, CellMap } from "./CellData";
import { CellGrid } from "./module/CellGrid";

export class CellView extends Application{

  private readonly _color = {
    background: 0x222222,
    line_major: 0xffffff,
    line_minor: 0x888888,
    cell: 0xffff00,

    frame: 0x2f404f,
    pattern_container: 0x1e1e1e,
    center_cell: 0xffda32,
    neighbor_cell: 0x3b4040,
    neighbor_cell_active: 0xeaeaea,
    range_button: 0x646464, // temp
    range_decal: 0xeaeaea,
    range_decal_active: 0x4eeaff,
    label_text: 0xeaeaea,
    label_text_error: 0xff6347,
    input_text: 0x647abe,
    input_background: 0x222222,
    input_border: 0xeaeaea,
    slider: 0x222222,
    thumb: 0xeaeaea,
    update_button: 0xffda32,
    update_button_active: 0xffe983,
    update_text: 0x8f8f8f,
    update_text_active: 0x647abe,
  }

  private grid: CellGrid;
  private current_state = new CellMap();
  private current_changes = new CellMap();

  /**
   * 
   * @param parent 
   * @param controller 
   */
  constructor(
    parent: HTMLElement,
    controls: UserRequest,
    initial_state: Cell[]
  ) {
    super({
      antialias: true,
      autoDensity: true,
      background: 0x000,
      resolution: window.devicePixelRatio || 1.0,
      resizeTo: parent
    });
    parent.appendChild(this.view as HTMLCanvasElement)
          .addEventListener('contextmenu', (e) => e.preventDefault());

    this.requestNext = controls.next;
    this.requestLast = controls.prev;
    this.requestClear = controls.reset;
    
    for (const cell of initial_state) {
      this.current_state.set(cell);
    }

    // Setup CellGrid
    const grid = this.grid = new CellGrid(
      this.renderer as Renderer,
      this.cellSelectHandler
    );
    this.stage.addChild(grid);

    grid.update(
      Array.from(this.current_state.values())
    );
    
    parent.ownerDocument
    .addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === ' ') {
        const options:AutomataOptions = {
          cells: Array.from(this.current_changes.values())
        }
        this.current_changes.clear();
        this.current_state = new CellMap(this.requestNext(options));
        this.updateDisplay();
      }
    });

  }
  
  private cellSelectHandler = (cell:Cell): void => {
    if (! this.current_changes.delete(cell) ) {
      this.current_changes.set(cell);
    } console.log(this.current_changes)
    this.updateDisplay();
  }

  private updateDisplay() {
    // Aggregate
    const draw_data = new Array<Cell>();

    // state NOR changes
    const painted_cells = new Set(this.current_state.keys());
    for (const key of this.current_changes.keys()) {
      if (! painted_cells.delete(key) ) {
        painted_cells.add(key);
      }
    }
    // Collect result
    for (const key of painted_cells) {
      const cell = this.current_state.get(key) || this.current_changes.get(key);
      if (! cell ) continue;
      draw_data.push(cell);
    }

    this.grid.update(draw_data);
  }

  private requestNext: UserRequest["next"];
  private requestLast: UserRequest["prev"];
  private requestClear: UserRequest["reset"];

  private reset() {
    if ( this.current_changes.size() === 0 ) {
      this.current_changes.clear();
    } else {
      this.current_state = new CellMap(this.requestClear());
    }
    this.updateDisplay();
  }

  

}