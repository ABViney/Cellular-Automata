import { Application } from "pixi.js";
import { Grid } from "./module/CellGrid";

export class CellView {

  /** @type {Application} */
  private readonly _app;

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

  /** Callback for client input */
  private _post: () => void ;

  /** Drawing is done, awaiting input */
  private _is_ready = false;

  /**
   * 
   * @param container 
   * @param callback 
   */
  constructor(container: HTMLElement, callback: () => void ) {
    this._app = new Application({
      antialias: true,
      autoDensity: true,
      background: 0x000000,
      resolution: window.devicePixelRatio || 1.0,
      resizeTo: container
    });
    container.appendChild(this._app.view as HTMLCanvasElement);
    this._post = callback;
  }

  public build(mobile: boolean) {
    this._is_ready = false;
    
    const screen = {
      width: this._app.screen.width,
      height: this._app.screen.height,
      center: {
        x: this._app.screen.width/2,
        y: this._app.screen.height/2
      }
    };
    
    const grid = new Grid(this._app);

    this._app.stage.addChild(grid);
  }

}