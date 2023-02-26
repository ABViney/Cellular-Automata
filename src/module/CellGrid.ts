import { Application, Container, FederatedPointerEvent, FederatedWheelEvent, Graphics, ILineStyleOptions, Matrix, MSAA_QUALITY, ParticleContainer, Point, Renderer, RenderTexture, Sprite, Texture } from "pixi.js";
import { Easing, Group, Interpolation, Tween } from "tweedle.js";
import { Cell, CellMap } from "../CellMap";
// import { Cell, CellMap } from "./CellMap";

interface GridInfo {
  background:number;
  offset:Point;
}

interface Zoomer {
  min:number;
  max:number;
  target:number; // What zoom should be
  actual:number; // What zoom is at
  at:Point, // Last cursor location
  smoothing:number; // ms between actual reaching target
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
  public grid = {
    background: 0x222222,

    // Viewing Position
    offset: new Point()
  };
  
  /** Zoom (scale) directives */
  public zoom: Zoomer = {
    min: 0.01,
    max: 5.0,
    target: 1.0,
    actual: 1.0,

    at: new Point(0),
    smoothing: 100 // ms
  };

  /** Event tracking */
  public event_info = {
    selecting: false,
    current_selection: new Set<Cell>(),

    panning: false,

    zoom_from: {x: 0, y: 0},
    zoom_to: {x: 0, y: 0}
  };

  constructor(app: Application) {
    super();

    const view = this.view = app.screen;
    const grid = this.grid;

    // Center origin 0 on screen
    grid.offset.x = -view.width/2;
    grid.offset.y = -view.height/2;
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
          this.cell.size = this.cell.default_size * this.zoom.actual;
          this._setLines();
        })
        .easing(Easing.Exponential.Out)
        .start()
    );

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
      case 2: // Right Click
        event_info.panning = true;
        event_info.selecting = false;
        this.on('pointermove', this._Pan);
        this.cursor = 'grabbing';
        break;
      case 1: // Middle Click
        this._resetView();
        break;
    }
  }

  _Pan(e: FederatedPointerEvent) {
    const offset = this.grid.offset;
    const dx = e.movement.x;
    const dy = e.movement.y;
    offset.x -= dx;
    offset.y -= dy;
    this._setLines();
  }

  /** Tweening for zoom changes */
  _zoom_smoothing: Group;

  _onMouseScroll(e: FederatedWheelEvent) {
    const zoom = this.zoom;
    e.client.copyTo(zoom.at); // TODO: grid offset should shift to focus toward
    const zoom_smoothing = this._zoom_smoothing;
    const direction = Math.sign(e.deltaY) * 0.1;

    zoom.target -= direction;
    zoom.target = Math.min(zoom.max, zoom.target);
    zoom.target = Math.max(zoom.min, zoom.target);

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
    offset.x = -width/2;
    offset.y = -height/2;
  }

  _onPointerUp(e: FederatedPointerEvent) {
    const event_info = this.event_info;
    switch (e.button) {
      case 2:
        event_info.panning = false;
        this.off('pointermove', this._Pan);
        this.cursor = 'pointer';
        break;
    }
  }

  update(cell_data: CellMap) {
    
  }
  
  private _graphics: Graphics;

  _setLines() {
    const {width, height} = this.view;
    const {background, offset} = this.grid;
    const {color, size} = this.cell;
    const {major, minor, step} = this.line;

    const g = this._graphics;

    type GridDrawData = {
      atlas: number[]; // All line draw positions
      start: number; // First drawn offset from 0
    };

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

    const reset = () => g.clear().beginFill(background).drawRect(0,0, width, height).endFill();
    const drawHorizontal = (offset:number) => g.moveTo(0, offset).lineTo(width, offset);
    const drawVertical = (offset:number) => g.moveTo(offset, 0).lineTo(offset, height);

    /** End of Utility functions */
    
    const vertical_lines = generateDrawData(offset.x, width);
    const horizontal_lines = generateDrawData(offset.y, height);
    
    reset();
    drawMinors(vertical_lines, drawVertical);
    drawMinors(horizontal_lines, drawHorizontal);
    drawMajors(vertical_lines, drawVertical);
    drawMajors(horizontal_lines, drawHorizontal);
  }
  
}
