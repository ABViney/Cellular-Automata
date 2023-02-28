import { Application, Container, FederatedPointerEvent, FederatedWheelEvent, Graphics, ILineStyleOptions, Matrix, MSAA_QUALITY, ParticleContainer, Point, Renderer, RenderTexture, Sprite, Texture } from "pixi.js";
import { Easing, Group, Interpolation, Tween } from "tweedle.js";
import { Cell, CellMap } from "../CellMap";

interface GridInfo {
  background:number;
  offset:Point;
  cells:CellMap;
  lines:{
    vertical:GridDrawData,
    horizontal:GridDrawData
  };
}

interface Zoomer {
  min:number;
  max:number;
  target:number; // What zoom should be
  actual:number; // What zoom is at
  direction:number; // In or out
  to:Point, // Last cursor location
  from:Point, // Push grid offset to/from
  smoothing:number; // ms between actual reaching target
};

    interface GridDrawData {
      atlas: number[]; // All line draw positions
      start: number; // First drawn offset from 0
    };

export class Grid extends Container {

  /** @type {Rectangle} */
  public view;

  // public textures: TextureDict;

  public cell = {
    default_size: 25, // Static value, scaled by zoom to get size
    size: 25,

    color: 0xffff00,
  };

  public line = {
    step: 5,/** Ratio of minor to major axis lines */
    lag: 10, // ms

    major: {
      width: 3,
      color: 0xffffff,
      alpha: 1
    },
    minor: {
      width: 2,
      color: 0x888888,
      alpha: 1
    }
  };
  
  /** Grid info */
  public grid: GridInfo = {
    background: 0x222222,

    // Viewing Position
    offset: new Point(),
    cells: new CellMap(),
    lines: { // Set during draw
      vertical:{} as GridDrawData,
      horizontal:{} as GridDrawData
    }
  };
  
  /** Zoom (scale) directives */
  public zoom: Zoomer = {
    min: 0.1,
    max: 5.0,
    target: 1.0,
    actual: 1.0,

    direction: 0,
    to: new Point(0),
    from: new Point(0),
    smoothing: 50 // ms
  };

  /** Event tracking */
  public event_info = {
    selecting: false,
    current_selection: new Set<number>(),

    panning: false,

    zoom_to: {x: 0, y: 0}
  };

  constructor(app: Application) {
    super();

    const view = this.view = app.screen;
    const grid = this.grid;
    grid.cells.set([0,0])
    const zoom = this.zoom;

    this._graphics = new Graphics();
    this.addChild(this._graphics);

    const zoom_smoothing = this._zoom_smoothing = new Group();
    zoom_smoothing.add(
      // Controls the rate at which zoom.actual becomes zoom.target
      // This modifies the current cell size.
      new Tween(zoom)
        .onStart((zoom:Zoomer, tween: Tween<Zoomer>) => {
          tween.from({actual: zoom.actual})
            .to({actual: zoom.target}, zoom.smoothing);
        })
        .onUpdate((zoom:Zoomer, elapsed:number, tween: Tween<Zoomer>) => {
          // Translate grid view to/from mouse position
          this.cell.size = this.cell.default_size * this.zoom.actual;
          this._setLines();
        })
        .easing(Easing.Exponential.Out)
        .start()
    );

    // reset grid pos, hostage drag to 0,0
    
    app.ticker.add((dt) => {
      zoom_smoothing.update(dt, true);
    });

    this.interactive = true;
    this.cursor = 'pointer';
    this.on('pointerdown', this._onPointerDown);
    this.on('pointerup', this._onPointerUp);
    this.on('wheel', this._onMouseScroll);
    // TODO: Need onAdded func

    this.on('added', this._onAdded);
  }

  _onAdded() {
    this._resetView();
  }

  _onPointerDown(e: FederatedPointerEvent) {
    const event_info = this.event_info;
    switch (e.button) {
      case 0:
          if (! event_info.panning ) {
            event_info.selecting = true;
            this.on('pointermove', this._paintSelection)
            this._paintSelection(e);

            this._setLines();
          }
        break;
      case 1: // Middle Click
        this._resetView();
        break;
      case 2: // Right Click
        event_info.panning = true;
        event_info.selecting = false;
        this.on('pointermove', this._pan);
        this.cursor = 'grabbing';
        break;
    }
  }

  _paintSelection(e: FederatedPointerEvent) {
    const {cells} = this.grid;
    const {selecting, current_selection} = this.event_info;

    // If selecting was turned off without a mouseup, remove handler
    if (! selecting ) {
      this.off('pointermove', this._paintSelection);
      return;
    }
    // Get cell coordinate
    const cursor = e.client;
    const cell = this._getCell(cursor);
    if ( cell ) {
      // Cursor position is valid
      // Check if cell has been painted already
      const hash = CellMap.hash(cell);
      if (! current_selection.has(hash) ) {
        // Cell hasn't been painted, toggle and remember to not repaint
        cells.toggle(cell);
        current_selection.add(hash);
        this._setLines();
      }
    }
  }

  _pan(e: FederatedPointerEvent) {
    const {offset} = this.grid;
    const {to} = this.zoom;
    const dx = e.movement.x;
    const dy = e.movement.y;
    offset.x -= dx;
    offset.y -= dy;
    to.x -= dx;
    to.y -= dy;
    
    this._setLines();
  }

  /** Tweening for zoom changes */
  _zoom_smoothing: Group;

  _onMouseScroll(e: FederatedWheelEvent) {
    const zoom = this.zoom;

    zoom.direction = Math.sign(e.deltaY);
    const movement = Math.sign(zoom.direction) * 0.1;
    zoom.target -= movement;
    zoom.target = Math.min(zoom.max, zoom.target);
    zoom.target = Math.max(zoom.min, zoom.target);

    const zoom_smoothing = this._zoom_smoothing;

    const tweens = zoom_smoothing.getAll();
    tweens[0].restart();
    // tweens[1].restart();
  }

  _resetView() {
    const zoom = this.zoom;
    zoom.target = 1;
    zoom.actual = zoom.min;
    
    const zoom_smoothing = this._zoom_smoothing;
    zoom_smoothing.getAll()[0].restart();

    const {width, height} = this.view;
    const {offset} = this.grid;
    offset.x = 0;
    offset.y = 0;
  }

  _onPointerUp(e: FederatedPointerEvent) {
    const event_info = this.event_info;
    switch (e.button) {
      case 0:
        event_info.selecting = false;
        event_info.current_selection.clear();
        break;
      case 2:
        event_info.panning = false;
        this.off('pointermove', this._pan);
        this.cursor = 'pointer';
        break;
    }
  }

  update(cell_data: CellMap) {
  
  }
  
  _getCell(cursor:Point):Cell|false {
    const {major, minor, step} = this.line;

    // Line and cell position data
    const {vertical, horizontal} = this.grid.lines;

    // Find which lines are directly above and behind the cursor
    let line_x = -1, line_y = -1;
    while (cursor.x >= vertical.atlas[line_x+1]) line_x++;
    while (cursor.y >= horizontal.atlas[line_y+1]) line_y++;
    
    // Selection is in bounds
    // Describe cell coordinate
    const cell:Cell = [
      vertical.start + line_x,
      horizontal.start + line_y
    ];

    // Ensure cursor isn't on a line
    const valid = (
      cursor.x > (vertical.atlas[line_x] // Position
                + (cell[0] % step ? minor.width : major.width))
      ) && (
      cursor.y > (horizontal.atlas[line_y]
                + (cell[1] % step ? minor.width : major.width))
    );

    return valid && cell;
  }

  private _graphics: Graphics;

  _setLines() {
    const {width, height} = this.view;
    const {background, offset, cells, lines} = this.grid;
    const {color, size} = this.cell;
    const {major, minor, step} = this.line;

    const g = this._graphics;


    /** Utilility Functions */

    /**
     * This grid originates from an imaginary origin of 0. Since lines have a mutable
     * thickness and may overlap eachother, and cells have displays dependent on a positional
     * offset, some information is needed to ensure the right data is being represented.
     * 
     * @param offset Distance from grid origin
     * @param dimension pixel distance to evaluate
     * @returns location data for the prescribed fields
     */
    const generateDrawData = (offset:number, dimension:number):GridDrawData => {
      const major_cell = major.width + size;
      const minor_cell = minor.width + size;

      // Sum of the core
      const pattern_sum = major_cell + minor_cell * (step-1);
      // Product of sum with quotient elicits value less than or equal to origin
      const quotient = Math.floor(offset / pattern_sum);
      
      // Nearest preceeding major
      let real_position = pattern_sum * quotient;
      let steps_taken = 0;
      while (real_position < offset) {
        real_position += steps_taken++ ? minor_cell : major_cell;
      }
      // Backstep if loop was entered
      if ( steps_taken ) real_position -= --steps_taken ? minor_cell : major_cell;

      const draw_data: GridDrawData = {
        atlas: [],
        start: quotient * step + steps_taken
      }

      // Initialized to the line backing the first visible cell
      let draw_position = real_position - offset;

      // Stow all drawing positions for this frame
      const {atlas} = draw_data;
      while (draw_position < dimension) {
        atlas.push(draw_position)
        draw_position += steps_taken++ % step 
                        ? minor_cell
                        : major_cell;
      }
      
      return draw_data;
    };

    const wrap = (val:number, min:number, max:number):number => {
      return (Math.abs(val)-min) % (max-min) + min;
    }

    const drawMinors = (draw_data:GridDrawData, drawFunc:Function) => {
      g.lineStyle(minor);
      const {atlas, start} = draw_data;
      for (let i = 0; i < atlas.length; i++) {
        if ((start + i) % step === 0) continue;
        drawFunc(atlas[i]);
      }
    };
    const drawMajors = (draw_data:GridDrawData, drawFunc:Function) => {
      g.lineStyle(major);
      const {atlas, start} = draw_data;
      for (let i = wrap(start,0,step); i < atlas.length; i+=step) drawFunc(atlas[i]);
    };
    const drawCells = (vertical_lines:GridDrawData, Horizontal_lines:GridDrawData) => {
      g.lineStyle({width: 0});
      g.beginFill(color);
      const v_atlas = vertical_lines.atlas,
            x_start = vertical_lines.start,
            x_end = vertical_lines.start + vertical_lines.atlas.length,
            h_atlas = horizontal_lines.atlas,
            y_start = horizontal_lines.start,
            y_end = horizontal_lines.start + horizontal_lines.atlas.length;
      
      for ( const cell of cells.values() ) {
        const [x,y] = cell;
        if ( x_start <= x && x <= x_end
          && y_start <= y && y <= y_end ) {
            const draw_x = v_atlas[x - x_start] + (x % step ? minor.width : major.width)-1;
            const draw_y = h_atlas[y - y_start] + (y % step ? minor.width : major.width)-1;
            g.drawRect(draw_x, draw_y, size, size);
          }
      }
      g.endFill();
    }

    const reset = () => g.clear().beginFill(background).drawRect(0,0, width, height).endFill();
    const drawHorizontal = (offset:number) => g.moveTo(0, offset).lineTo(width, offset);
    const drawVertical = (offset:number) => g.moveTo(offset, 0).lineTo(offset, height);

    /** End of Utility functions */
    
    // Grid offset denotes the client's top left corner in relation to an imaginary 0.
    // Since the client's width and height don't affect  where the grid offset is,
    // its value can be compensated offset half the viewable dimension in order to
    // center data that exists around that position in the viewport.
    const vertical_lines = lines.vertical = generateDrawData(offset.x - width/2, width);
    const horizontal_lines = lines.horizontal = generateDrawData(offset.y - height/2, height);
    
    reset();
    drawMinors(vertical_lines, drawVertical);
    drawMinors(horizontal_lines, drawHorizontal);
    drawMajors(vertical_lines, drawVertical);
    drawMajors(horizontal_lines, drawHorizontal);
    drawCells(vertical_lines, horizontal_lines);


  }
  
}
