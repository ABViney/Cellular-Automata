import { Application, Renderer } from "pixi.js";
import AssetManager from "./module/CellAssets";
import { AutomataOptions, UserRequest } from "./utils/CellContracts";
import { Cell, CellMap } from "./utils/CellData";
import { CellGrid } from "./module/CellGrid";
// import { CellUI } from "./module/CellUI";
import { CellUI } from "./module/CellUI";

export class CellView extends Application {

  private asset_man: AssetManager;

  private grid: CellGrid;
  private current_state: CellMap;
  private current_changes: CellMap;

  private ui: CellUI;

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

    // Prevent context menu on document container
    parent.appendChild(this.view as HTMLCanvasElement)
          .addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Building application textures
    this.asset_man = new AssetManager(this.renderer as Renderer);

    // User controls
    this.requestNext = controls.next;
    this.requestLast = controls.prev;
    this.requestClear = controls.reset;
    
    // Grid display data
    this.current_state = new CellMap(initial_state);
    this.current_changes = new CellMap();

    // Setup CellGrid
    const grid = this.grid = new CellGrid(
      this.renderer as Renderer,
      this.cellSelectHandler
    );
    this.stage.addChild(grid);
    grid.update(
      Array.from(this.current_state.values())
    );

    // Setup UI
    const ui = this.ui = new CellUI(
      this.renderer
    );
    this.stage.addChild(ui);
    ui.resize(this.view.width, this.view.height)


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
    }
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