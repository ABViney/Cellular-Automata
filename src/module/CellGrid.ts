import { Application, Container, FederatedPointerEvent, Graphics, ILineStyleOptions, Matrix, MSAA_QUALITY, ParticleContainer, Point, Renderer, RenderTexture, Sprite, Texture } from "pixi.js";
import { Easing, Group, Tween } from "tweedle.js";
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

export class Grid extends Container {

  /** @type {Renderer} */
  public renderer;

  /** @type {Rectangle} */
  public view;

  public textures: TextureDict;
  public context = new Graphics();

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
      width: 2,
      color: 0xffffff,
      alpha: 1
    },
    minor: {
      width: 1,
      color: 0x888888,
      alpha: 1
    }
  };
  
  /** Grid info */
  public grid = {
    background: 0x222222,
    bound: {
      x: {
        lower: 0,
        upper: 1
      },
      y: {
        lower: 0,
        upper: 1
      }
    },
    // Viewing Position
    offset: {
      x: 0,
      y: 0
    }
  };
  
  /** Zoom (scale) directives */
  public zoom = {
    min: 0.1,
    max: 5.0,
    target: 1.0,
    actual: 5.0
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
    (renderer as Renderer).framebuffer.blit();
    const view = this.view = app.screen;
    
    // Not sure how to tell typescript this is okay
    this.textures = this._generateTextures();
    this._createGrid();
    this._setLines();
    
    app.ticker.add((dt) => {
    })
    this.on("added", ()=> {
      
      setTimeout(() => {
        
        
      }, 4000);
    })

    this.interactive = true;
    this.cursor = 'pointer';
    this.on('pointerdown', this._onPointerDown);
    this.on('pointerup', this._onPointerUp);
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

    // this.x += dx;
    // this.y += dy;
    this._setLines();
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
      texture.defaultAnchor.set(0.5);
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
   * @returns the least amount of lines needed to fill the screen
   */
  _measureLineNeed(size: number, scalar?: number): number {
    const line = this.line;
    const cell = this.cell;
    if ( scalar ) return Math.floor(size / this._calculateCellSize(scalar));
    return Math.floor(size / (cell.size));
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

    const vertical_lines = this.children[1].children as Sprite[];
    const horizontal_lines = this.children[2].children as Sprite[];
    // const cells = this.children[3].children as Sprite[];
    
    // Simulated left and top edges of the screen
    // const left = grid.offset.x - view.width/2;
    // const up = grid.offset.y - view.height/2;

    // User remainder to mark zeroith real positions
    const v_zero = vertical_lines[0].x = Math.abs(grid.offset.x % view.width);
    const h_zero = horizontal_lines[0].y = Math.abs(grid.offset.y % view.height);

    const context = this.context;
    context.clear();


    function setAxis(
      axis: "x"|"y",
      edge: number, // pixels
      lines: Sprite[]
    ) {
      
      const lineStyle = axis === "x"
                        ? textures.vertical
                        : textures.horizontal;

      // 
      const step_distance = cell.size * line.step;

      // Before this is in bound with the current window
      // Once the grid offset e
      const bounds = edge
                    + (step_distance - edge % step_distance);
      // Its shifted to a positive position on screen
      const zero = grid.offset[axis] % bounds
                  + Number(grid.offset[axis] < 0) * bounds;

      let i = 0;
      // Preceeding the first position
      let steps_from_zero = -Math.round(zero / cell.size);
      console.log(zero, steps_from_zero)
      let axis_coordinate = zero
                    + (steps_from_zero * cell.size);

      // Iterates all lines only at the minimum scale
      while (i < lines.length) {
      // console.log('steps from zero = ' +axis + steps_from_zero)
        const target = lines[i++];

        // No more lines needed, turn off
        // any stragglers, then finish.
        if ( axis_coordinate > bounds ) {
          if ( target.visible ) {
            target.visible = false;
            continue;
          }
          else {
            // All done
            return;
          }
        }

        // Lines still needed
        target[axis] = axis_coordinate;
        target.visible = true;
        target.texture = steps_from_zero % line.step
                        ? lineStyle.minor
                        : lineStyle.major;
        if (target[axis] === zero) target.tint = 0xff0000;
        else target.tint = 0xffffff;
        axis_coordinate += cell.size;
        steps_from_zero++;
      }
    }

    setAxis("x", view.width, vertical_lines);
    setAxis("y", view.height, horizontal_lines);
  }
  
}
