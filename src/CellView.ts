import { Application, Container, FederatedPointerEvent, Graphics, Point, Sprite } from "pixi.js";
import { Cell, CellMap } from "./CellMap";

class Grid extends Container {

  public color = {
    background: 0x222222,
    line_major: 0xffffff,
    line_minor: 0x888888,
    cell: 0xffff00
  };

  /** @type {Renderer} */
  public renderer;

  /** @type {Rectangle} */
  public screen;

  /** Pixel width of a cell at normal scale */
  public cell_size = 24;

  /** Ratio of minor to major axis lines */
  public interval = 5;
  
  /** Current view position */
  public pos = {x: 0, y: 0};
  
  /** Current zoom (scale) */
  public zoom = 1.0;
  
  /** Location of zoom event */
  public zoom_point = {x: 0, y: 0};

  /** Event tracking */
  public event_info = {
    selecting: false,
    current_selection: new Set<Cell>(),

    panning: false,
    pan_from: {x: 0, y: 0},
    grid_offset: {x: 0, y: 0},
    snapback: (this.cell_size + 1) * this.interval
  };

  constructor(app: Application) {
    super();

    const renderer = this.renderer = app.renderer;

    const screen = this.screen = {
      width: app.screen.width,
      height: app.screen.height,
      center: {
        x: app.screen.width/2,
        y: app.screen.height/2
      }
    };

    // Scalar limits
    const min_zoom = 0.1;
    // const max_zoom = 5.0;
    
    // separate containers for simplicity
    const grid = new Container();
    const vertical_lines = new Container();
    const horizontal_lines = new Container();

    let vertical_center_index = 0;
    let horizontal_center_index = 0;


    /**
     * Builds background and grid lines, ensuring there's enough to fit the screen at
     * the minimum scale. Called when screen size increases.
     * 
     */
    const generateGrid = () => {
      const textures = this._generateGridTextures();
      
      // clear containers
      grid.removeChildren();
      vertical_lines.removeChildren();
      horizontal_lines.removeChildren();

      const background = Sprite.from(textures.background);
      background.x = screen.center.x;
      background.y = screen.center.y;
      grid.addChild(background);

      const calculateLineNeed = (dimension: number, scale: number): number => {
        return Math.floor(dimension / (1 + this.cell_size * scale))
        + 2 * this.interval
        + 1;
      };
      const number_of_vertical_lines = calculateLineNeed(screen.width, min_zoom);
      vertical_center_index = Math.ceil(number_of_vertical_lines/2);
      const vbuffer = vertical_center_index % this.interval;
      for(let i = 0; i < number_of_vertical_lines + 0; i++) {
        let line: Sprite = Sprite.from( (i+vbuffer) % this.interval // 0 or truthy
                                        ? textures.vertical_line_minor
                                        : textures.vertical_line_major);
        vertical_lines.addChild(line).y = screen.center.y;
        line.x = (i - vertical_center_index) * this.cell_size;
      }
      const number_of_horizontal_lines = calculateLineNeed(screen.height, min_zoom);
      horizontal_center_index = Math.ceil(number_of_horizontal_lines/2);
      const hbuffer = horizontal_center_index % this.interval;
      for(let i = 0; i < number_of_horizontal_lines; i++) {
        let line: Sprite = Sprite.from( (i+hbuffer) % this.interval // 0 or truthy
                                        ? textures.horizontal_line_minor
                                        : textures.horizontal_line_major);
        horizontal_lines.addChild(line).x = screen.center.x;
        line.y = (i - horizontal_center_index) * this.cell_size;
      }
    };
    generateGrid();
    
      // Tracks number of visible lines for the current view
    /**
     * Emplace lines in proper positions to fill out 
     * TODO: This function must move gridlines into place. Use Tweedle.js; see if the
     * tween objects are persistant. What I mean by this is that I want to set the
     * animation (time for movement and elasticity) once while being able to update
     * the destination as necessary. Check source for tween updates and see if a boolean
     * to track when all visible lines are in place is necessary: don't want to overburden
     * ticker update cycles
     */
    const emplaceGridLines = () => { // 
      // Lines spaced by zoom level
      const gap = (this.cell_size + 1) * this.zoom;
      const vertical_line_count = vertical_lines.children.length;
      const v_start = vertical_lines.children[vertical_center_index].x = screen.center.x + this.pos.x;
      for (let i = 1; i < Math.floor(vertical_line_count / 2); i++) {
        vertical_lines.getChildAt(vertical_center_index-i).x = v_start-i*gap;
        vertical_lines.getChildAt(vertical_center_index+i).x = v_start+i*gap-1;
      }
      const horizontal_line_count = horizontal_lines.children.length;
      const h_start = horizontal_lines.children[horizontal_center_index].y = screen.center.y + this.pos.y;
      for (let i = 1; i < Math.floor(horizontal_line_count / 2); i++) {
        horizontal_lines.getChildAt(horizontal_center_index-i).y = h_start-i*gap;
        horizontal_lines.getChildAt(horizontal_center_index+i).y = h_start+i*gap;
      }
    };
    emplaceGridLines();


    grid.addChild(vertical_lines, horizontal_lines);

    
    this.addChild(grid);
    
    grid.interactive = true;
    grid.cursor = 'pointer';
    grid.on('pointerdown', this._onPointerDown, grid);
    grid.on('pointerup', this._onPointerUp, grid);

    // TODO: Place this into mousewheel listener
    // this.event_info.snapback = (this.cell_size+1) * this.interval;
  }

  _onPointerDown(e: FederatedPointerEvent) {
    const event_info = this.event_info;
    switch (e.button) {
      case 2: // Begin pan
        event_info.panning = true;
        event_info.selecting = false;
        e.client.copyTo(event_info.pan_from as Point);
        this.on('pointermove', this._Pan);
        this.cursor = 'grabbing';
        break;
  //     case 1: // Begin selection
  //         if ( panning ) return;
  //         selecting = true;
  //         current_selection.clear();
  //         this.hoverCursor = 'cell';
  //         canvas.setCursor('cell');
  //         const reciever = canvas._searchPossibleTargets(
  //             cell.all.getObjects(),
  //             canvas.getPointer(e, true)
  //         );
  //         if ( reciever ) reciever.fire('mousedown');
  //         break;
  //     case 2: // Reset Camera
  //         if ( selecting || panning ) return;
  //         grid_offset_x = 0;
  //         grid_offset_y = 0;

  //         cell.all.left = cell.all.top = 0;
  //         cell.all.scale(zoom ** -1)
  //         line.horizontal.left = line.horizontal.top = 0;
  //         line.horizontal.scaleX = 1;
  //         line.vertical.left = line.vertical.top = 0;

  //         camera.x = 0;
  //         camera.y = 0;
  //         zoom = 1;
  //         // need to redraw cells
    }
  }

  _Pan(e: FederatedPointerEvent) {
    console.log(this);
    const snapback = this.event_info.snapback;
    const movement = e.movement;
    if ( e.movement.x ) {
      const vertical_lines = this.children[1];
      vertical_lines.x += movement.x;
      if ( Math.abs(vertical_lines.x) > snapback )
        vertical_lines.x -= Math.sign(vertical_lines.x) * snapback;
    }
    if ( e.movement.y ) {
      const horizontal_lines = this.children[2];

    }

  }

  _onPointerUp(e: FederatedPointerEvent) {
    
  }

  update(cell_data: CellMap) {
    
  }

  _generateGridTextures() {
    const screen = this.screen;
    const renderer = this.renderer;

    // Create graphics elements
    const background_template = new Graphics();
    const vertical_line_major_template = new Graphics();
    const vertical_line_minor_template = new Graphics();
    const horizontal_line_major_template = new Graphics();
    const horizontal_line_minor_template = new Graphics();
    // Set graphics properties
    background_template.beginFill(this.color.background, 1);
    vertical_line_major_template.lineStyle({width: 1, color: this.color.line_major, alpha: 1});
    vertical_line_minor_template.lineStyle({width: 1, color: this.color.line_minor, alpha: 1});
    horizontal_line_major_template.lineStyle({width: 1, color: this.color.line_major, alpha: 1});
    horizontal_line_minor_template.lineStyle({width: 1, color: this.color.line_minor, alpha: 1});
    // Draw
    background_template.drawRect(0, 0, screen.width, screen.height);
    vertical_line_major_template.lineTo(0, screen.height);
    vertical_line_minor_template.lineTo(0, screen.height);
    horizontal_line_major_template.lineTo(screen.width, 0);
    horizontal_line_minor_template.lineTo(screen.width, 0);
    // Use renderer to derive texture from graphics
    const background_texture = renderer.generateTexture(background_template);
    const vertical_line_major_texture = renderer.generateTexture(vertical_line_major_template);
    const vertical_line_minor_texture = renderer.generateTexture(vertical_line_minor_template);
    const horizontal_line_major_texture = renderer.generateTexture(horizontal_line_major_template);
    const horizontal_line_minor_texture = renderer.generateTexture(horizontal_line_minor_template);
    // Release graphics resources
    background_template.destroy();
    vertical_line_major_template.destroy();
    vertical_line_minor_template.destroy();
    horizontal_line_major_template.destroy();
    horizontal_line_minor_template.destroy();
    // Set texture origins for sprites to inherit
    background_texture.defaultAnchor.set(0.5);
    vertical_line_major_texture.defaultAnchor.set(0.5);
    vertical_line_minor_texture.defaultAnchor.set(0.5);
    horizontal_line_major_texture.defaultAnchor.set(0.5);
    horizontal_line_minor_texture.defaultAnchor.set(0.5);

    return {
      background: background_texture,
      vertical_line_major: vertical_line_major_texture,
      vertical_line_minor: vertical_line_minor_texture,
      horizontal_line_major: horizontal_line_major_texture,
      horizontal_line_minor: horizontal_line_minor_texture
    };
  }
}

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