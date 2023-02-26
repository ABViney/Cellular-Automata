import { Application, Container, FederatedPointerEvent, FederatedWheelEvent, Graphics, ILineStyleOptions, Matrix, MSAA_QUALITY, ParticleContainer, Point, Renderer, RenderTexture, Sprite, Texture } from "pixi.js";
import { Easing, Group, Interpolation, Tween } from "tweedle.js";
import { Cell, CellMap } from "../CellMap";
// import { Cell, CellMap } from "./CellMap";

interface TextureDict {
  background: Texture;
  cell: Texture;
  vertical: {
    major: Texture,
    minor: Texture
  };
  horizontal: {
    major: Texture,
    minor: Texture
  };
};

interface GridInfo {
  background:number;
  offset:Point;
  window:Point;
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

  /** @type {Renderer} */
  public renderer;

  /** @type {Rectangle} */
  public view;

  public textures: TextureDict;

  public cell = {
    default_size: 25, // Static value, scaled by zoom to get size
    size: 25,

    color: 0xffff00,
  };

  public line = {
    size: 1, // px

    step: 5,/** Ratio of minor to major axis lines */
    lag: 10, // ms

    major: {
      width: 20,
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
    offset: new Point(),
    window: new Point()
  };
  
  /** Zoom (scale) directives */
  public zoom: Zoomer = {
    min: 0.1,
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

    const renderer = this.renderer = app.renderer;
    const view = this.view = app.screen;
    const grid = this.grid;
    grid.offset.x = -view.width/2;
    grid.offset.y = -view.height/2;
    const zoom = this.zoom;

    const d = new Point();

    const zoom_smoothing = this._zoom_smoothing = new Group();
    zoom_smoothing.add(
      // Controls the rate at which zoom.actual becomes zoom.target
      // This modifies the current cell size.
      new Tween(zoom)
        .onStart((zoom:Zoomer, tween: Tween<Zoomer>) => {
          const offset = grid.offset;
          const window = grid.window;
          const cell = this.cell;
          /**
           * TODO: Putting a pin in this for the moment.
           * Every time the grid offset passes an integer product of the current displays
           * boundaries, its relevant draw data changes. This can provide significant
           * performance improvements alongside refactoring how data is requested prior
           * to being drawn:
           *  Where offset = the distance of the grid crosshair's from the center of the grid.
           *  Where bounds = the distance the crosshair must travel before overlapping the screen.
           *    e.g. current_frame_x = floor( offset.x / bound.x*2 )
           *  
           * If the data requested includes the current frame and any adjacent frames, that's fine.
           * However, at current, the crosshair having an arbitrary amount of travel space offscreen
           *  means that cells will be missed (only existing outside of the client's view) if, once
           *  it crosses that boundary, new data is loaded.
           */
          // What i'm doing is writing how the current window is derived.
          // Window describes an x,y coordinate that describes a subset of
          // cells for the current view. Assuming that the zero of an axis
          // is the center of a window, the offset divided by 2*boundary
          // will floor to an integer value that is accurate (probably, need testing)
          // Doing it with only 1 boundary will result in floating points that aren't
          // consistent from positive to negative 
          // This is in pursuit of getting the grid offset to increment in time with zoom
          // so the client feels more responsive
          const bound_x = this._measureLineNeed(view.width) * cell.size;
          const bound_y = this._measureLineNeed(view.height) * cell.size;

          window.x = Math.floor(offset.x / bound_x*2);
          window.y = Math.floor(offset.y / bound_y*2);

          const push = cell.size / this._calculateCellSize(zoom.target);
          
          d.x = Math.floor((zoom.at.x - (offset.x % bound_x)) / cell.size) * push;
          d.y = Math.floor((zoom.at.y - (offset.y % bound_y)) / cell.size) * push;

          tween.from({actual: zoom.actual})
            .to({actual: zoom.target}, zoom.smoothing);
        })
        .onUpdate((zoom:Zoomer, elapsed:number, tween: Tween<Zoomer>) => {
          this._calculateCellSize();
          // this._setLines();
        })
        .easing(Easing.Exponential.Out)
        .start()
    );

    // zoom_smoothing.add(
    //   new Tween(offset)
    //     .onStart((offset: Point, tween: Tween<Point>) => {
    //       const {x, y} = offset;
    //       tween.from({x: x, y: y})
    //         .dynamicTo({x: x-d.x, y: y-d.y}, zoom.smoothing);
    //     })
    //     .onUpdate(() => {
    //       this._setLines()
    //     })
    //     .easing(Easing.Exponential.Out)
    //     .start()
    // );
    
    // Not sure how to tell typescript this is okay
    this.textures = this._generateTextures();
    this._createGrid();
    this._setLines();
    
    app.ticker.add((dt) => {
      zoom_smoothing.update(dt, true);
      grid.offset.x -= 0.1;
      this._setLines();
    })
    this.on("added", ()=> {
      
      setTimeout(() => {
        
        
      }, 4000);
    })

    this.interactive = true;
    this.cursor = 'pointer';
    this.on('pointerdown', this._onPointerDown);
    this.on('pointerup', this._onPointerUp);
    this.on('wheel', this._onMouseScroll);
  }

  _onPointerDown(e: FederatedPointerEvent) {
    const event_info = this.event_info;
    switch (e.button) {
      case 2: // Begin pan
        event_info.panning = true;
        event_info.selecting = false;
        this.on('pointermove', this._Pan);
        this.cursor = 'grabbing';
        break;
    }
  }

  _Pan(e: FederatedPointerEvent) {
    const offset = this.grid.offset;
    const dx = e.movement.x;
    const dy = e.movement.y;
    offset.x += dx;
    offset.y += dy;
    this._setLines();
  }

  _zoom_smoothing: Group;

  _onMouseScroll(e: FederatedWheelEvent) {
    const zoom = this.zoom;
    e.client.copyTo(zoom.at);
    const zoom_smoothing = this._zoom_smoothing;
    const direction = Math.sign(e.deltaY) * zoom.min;

    zoom.target -= direction;
    zoom.target = Math.min(zoom.max, zoom.target);
    zoom.target = Math.max(zoom.min, zoom.target);

    const tweens = zoom_smoothing.getAll();
    tweens[0].restart();
    // tweens[1].restart();
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

  _generateTextures() {
    const view = this.view;
    const renderer = this.renderer;
    const grid = this.grid;
    const line = this.line;
    const cell = this.cell;

    const rectHelper = (color:number, width:number, height?:number):RenderTexture => {
      const g = new Graphics();
      g.beginFill(color, 1);
      g.drawRect(0, 0, width, height || width);
      g.endFill();
      const texture = renderer.generateTexture(g);
      g.destroy();
      return texture;
    };

    const lineHelper = (axis: string, style:ILineStyleOptions):RenderTexture => {
      const g = new Graphics();
      g.lineStyle(style);

      if ( axis === "x" ) {
          g.lineTo(0, view.height);
          
      } else {
        g.lineTo(view.width, 0);
      }
      const texture = renderer.generateTexture(g,{
        multisample: MSAA_QUALITY.HIGH
      });
      g.destroy();
      // texture.defaultAnchor.set(0.5);
      return texture;
    };


    return this.textures = {
      // Background covers the entire visible screen
      // Also acts as a backboard for pointer events
      background: rectHelper(grid.background, view.width, view.height),
      // Cells size to whatever the cell size is scaled by zoom
      cell: rectHelper(cell.color, 100),
      // Lines are fitted to the screen's dimensions
      // A resizing of the canvas entitles a redrawing of these lines
      vertical: {
        major: lineHelper("x", line.major),
        minor: lineHelper("x", line.minor)
      },
      horizontal: {
        major: lineHelper("y", line.major),
        minor: lineHelper("y", line.minor)
      }
    };
  }

  // Wrap a number between two points
  // Inclusive exclusive
  // _wrap(val:number, min:number, max:number):number {
  //   if( val < 0 ) return -this._wrap(-val, -max, -min);
  //   return val % (max-min) + min;
  // }
  
  // Get cell size at current scale or at provided scale
  _calculateCellSize(scalar?: number) {
    const size = this.cell.default_size * (scalar || this.zoom.actual);
    if (! scalar ) this.cell.size = size;
    return size;
  }

  /**
   * @param size in pixels of visible space
   * @param scalar optional scaling of cell size
   * @returns the recommended amount of lines needed
   *          to fill the prescribed dimension
   */
  _measureLineNeed(size: number, scalar?: number): number {
    const line = this.line;
    const cell = this.cell;
    if ( scalar ) return Math.ceil(size / this._calculateCellSize(scalar));
    return Math.ceil(size / (cell.size));
  }

  /**
   * A single vertical and horizontal line decide where everything
   * on screen is placed. There isn't anything fantastical about them.
   * 
   * This method, however, is an entitlement of resizing the canvas.
   * Therefore it will clear this display and all children, redrawing
   * for the new dimensions.
   */
  _createGrid() {
    for ( const child of this.children ) child.destroy(); // Getting rid of the old

    const view = this.view;
    const zoom = this.zoom;
    const textures = this.textures;

    const vertical_lines = new Container();
    const horizontal_lines = new Container();
    // const cells = new ParticleContainer();

    this.addChild(
      Sprite.from(textures.background),
      vertical_lines,
      horizontal_lines,
      // cells
    );

    const vertical_need = this._measureLineNeed(view.width, zoom.min);
    const horizontal_need = this._measureLineNeed(view.height, zoom.min);
    const cell_need = vertical_need * horizontal_need;
    
    for (let i = 0; i < vertical_need; i++) {
      vertical_lines.addChild(new Sprite()).visible = false;
    }
    for (let i = 0; i < horizontal_need; i++) {
      horizontal_lines.addChild(new Sprite()).visible = false;
    }
    // for (let i = 0; i < cell_need; i++) {
    //   cells.addChild(Sprite.from(textures.cell)).visible = false;
    // } console.log(cells.children.findIndex(c => c.visible));
  }

  _setLines() {
    const view = this.view;
    const grid = this.grid;
    const cell = this.cell;
    const line = this.line;
    const textures = this.textures;

    const floor = (num:number):number => num >> 0;
    const wrap = (val:number, min:number, max:number):number => {
      const negative = 1 / val < 0;
      const diff = max-min;
      if (negative) return max + val % diff;
      return min + val % diff;
    }

    const vertical_lines = this.children[1].children as Sprite[];
    const horizontal_lines = this.children[2].children as Sprite[];
    // const cells = this.children[3].children as Sprite[];

    // NOTE: Refactoring from here
    function setAxis(
      axis: "x"|"y",
      edge: number, // pixels
      lines: Sprite[]
    ) {
      
      const lineStyle = axis === "x"
                        ? textures.vertical
                        : textures.horizontal;
      const dimension = axis === "x"
                        ? "width"
                        : "height";

      const step_between_majors = line.step;
      


      // Offset marks the first line offscreen client left
      // let offset = grid.offset[axis] % cell.size;

        // Major cell size, minor cell size
      const major_cell = lineStyle.major[dimension] + cell.size;
      const minor_cell = lineStyle.minor[dimension] + cell.size;

      let steps = 0;
      let offset = (function() {
        // Sum of the core
        let pattern_sum = major_cell
                          + (step_between_majors-1) * minor_cell;
        
        // Floored quotient elicits product with sum less than grid offset
        const quotient = Math.floor(grid.offset[axis] / pattern_sum);
        pattern_sum *= quotient;
        let last_added = 0;
        for (; pattern_sum < grid.offset[axis]; steps++) {
          last_added = steps === 0 ? major_cell : minor_cell;
          pattern_sum += last_added;
        }
        // If loop was entered roll back 1
        if ( steps ) {
          steps--;
          pattern_sum -= last_added;
        }
        // Difference is first draw position, steps in line
        return pattern_sum - grid.offset[axis];
      })()

      /**
       * Not sure entirely, but I think the issue is htat I need to
       * compensate for the size of every line that would come before.
       * It shouls just be a little more math. Should........
       */

      // let offset = normal % cell.size;
      // 
      // const steps = Math.floor(grid.offset[axis] / cell.size) - 1;
      // A negative value is offscreen, so its shifted forward
      // if (offset && grid.offset[axis] < 0) offset = cell.size + offset;
      // if (axis == 'x' && offset > -1)console.log(offset)

      let i = 0;
      while (i < lines.length) {
        const line = lines[i];
        if (offset > edge + cell.size) {
          if ( line.visible ) {
            line.visible = false;
            i++
            continue;
          } else {
            return;
          }
        }
        // if (axis == 'x' && offset > -10) console.log(line)
        line[axis] = offset;
        if (steps % step_between_majors === 0) {
          line.texture = lineStyle.major;
        } else {
          line.texture = lineStyle.minor;
        }
        offset += cell.size + line.texture[dimension];
        line.visible = true;
        i++
        steps++;
      }
      
    }

    setAxis("x", view.width, vertical_lines);
    setAxis("y", view.height, horizontal_lines);
  }
  
}
