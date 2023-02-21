import { Application, Container, FederatedPointerEvent, Graphics, ParticleContainer, Point, RenderTexture, Sprite, Texture } from "pixi.js";
import { Easing, Group, Tween } from "tweedle.js";
import { Cell, CellMap } from "../CellMap";
// import { Cell, CellMap } from "./CellMap";

interface TextureDict {
  background: Texture;
  cell: Texture;
  vertical_line: Texture;
  horizontal_line: Texture;
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

    interval: 5,/** Ratio of minor to major axis lines */
    lag: 10, // ms

    major: 0xffffff,
    minor: 0x888888,
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
    const view = this.view = app.screen;``
    
    // Not sure how to tell typescript this is okay
    this.textures = this._generateTextures();
    this._createGrid();
    this._setLines();
    
    app.ticker.add((dt) => {
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
  }

  _onPointerDown(e: FederatedPointerEvent) {
    console.log(e);
    const event_info = this.event_info;
    switch (e.button) {
      case 2: // Begin pan
        event_info.panning = true;
        event_info.selecting = false;
        this.on('pointermove', this._Pan);
        this.cursor = 'grabbing';
        break;
    } console.log(this.grid.offset)
  }

  _Pan(e: FederatedPointerEvent) {
    const offset = this.grid.offset;
    const dx = e.movement.x;
    const dy = e.movement.y;
    offset.x += dx;
    offset.y += dy;
  }

  _onPointerUp(e: FederatedPointerEvent) {
    
  }

  update(cell_data: CellMap) {
    
  }

  _generateTextures() {
    const view = this.view;
    const renderer = this.renderer;
    const grid = this.grid;
    const line = this.line;
    const cell = this.cell;

    const rectHelper = (color:number, width:number, height?:number) => {
      const g = new Graphics();
      g.beginFill(color, 1);
      g.drawRect(0, 0, width, height || width);
      g.endFill();
      const texture = renderer.generateTexture(g);
      g.destroy();
      return texture;
    };

    const lineHelper = (x:number, y:number) => {
      const g = new Graphics();
      g.lineStyle({width: line.size, color: line.major, alpha: 1});
      g.lineTo(x, y);
      const texture = renderer.generateTexture(g);
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
      vertical_line: lineHelper(0, view.height),
      horizontal_line: lineHelper(view.width, 0)
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

    const vertical_lines = new ParticleContainer();
    const horizontal_lines = new ParticleContainer();
    const cells = new ParticleContainer();

    this.addChild(
      Sprite.from(textures.background),
      vertical_lines,
      horizontal_lines,
      cells
    );

    const vertical_need = this._measureLineNeed(view.width, zoom.min);
    const horizontal_need = this._measureLineNeed(view.height, zoom.min);
    const cell_need = vertical_need * horizontal_need;

    for (let i = 0; i < vertical_need; i++) {
      vertical_lines.addChild(Sprite.from(textures.vertical_line)).visible = false;
    }
    for (let i = 0; i < horizontal_need; i++) {
      horizontal_lines.addChild(Sprite.from(textures.horizontal_line)).visible = false;
    }
    for (let i = 0; i < cell_need; i++) {
      cells.addChild(Sprite.from(textures.cell)).visible = false;
    } console.log(cells.children.findIndex(c => c.visible));
  }

  _setLines() {
    const view = this.view;
    const grid = this.grid;
    const cell = this.cell;
    const line = this.line;

    
    const vertical_lines = this.children[1].children as Sprite[];
    const horizontal_lines = this.children[2].children as Sprite[];
    const cells = this.children[3].children as Sprite[];

    // Distance between line majors
    const interval = cell.size * line.interval;
    
    // Simulated left and top edges of the screen
    const left = grid.offset.x - view.width/2;
    const up = grid.offset.y - view.height/2;

    // x is set to be the first position that a line will be drawn
    let x = left % cell.size
            // a negative x is useless, this ensures its positive
            + Number(left < 0) * cell.size;

    for ( const vline of vertical_lines ) {
      // If x has surpassed the screen's width
      if ( x > view.width ) {
        // Ensure that no other lines are unexpectedly rendering
        if ( vline.visible ) vline.visible = false;
        // Since accessing is linear, the first falsey marks the rest as safe
        else break;
      };

      // This describes the "real" position of the x value
      // that line positions and colors are derived from
      const low_x = x + left;
      vline.tint = low_x % interval
                  ? line.minor
                  : line.major;
      // On screen placement
      vline.x = x;
      vline.visible = true;
      x += cell.size;
    }

    let y = up % cell.size
            + Number(up < 0) * cell.size;
    for ( const hline of horizontal_lines ) {
      if ( y > view.height ) {
        if ( hline.visible ) hline.visible = false;
        else break;
      }
      const low_y = y + up;
      hline.tint = low_y % interval
                  ? line.minor
                  : line.major;
      hline.y = y;
      hline.visible = true;
      y += cell.size;
    }
    /**
     * TODO: Iterating from zero position in both directions placing sprites
     * at every cell gap
     * Not doing gap = cell + line, just set cell size and line size, let them overlap.
     *  Will need to deal with z-index issue eventually
     * 
     */
    
  }
  /**
   * REVISE: Fuck, I hate this.
   * Idea is to only make two explicit axis --
   * A vertical and a horizontal axis
   * 
   * Reasoning: These two decide where everything else is
   * Howto: Instead of making a fuck ton of objects, I can just make two
   *  and instantiate by demand.
   * 
   * These two axis will act as the "origin" of the current window
   *  i.e. when one goes offscreen and appears on the other side, its obvious
   *  that any cells that would be before or after that origin point will no longer
   *  be displayed.
   * 
   * This also means that cell sizes can be dynamically altered while leaving the grid lines
   * available at all times
   * 
   * The crosshairs listen to the current grid offset and will increment whatever pointer offset
   * aids in describing which cell was clicked when appropriate.
   */
  // _generateAssets() {
  //   const textures = this._generateTextures();
    
  //   // clear this container
  //   this.children.forEach((obj) => obj.destroy());

  //   // new resized background, new line containers
  //   this.addChild(Sprite.from(textures.background), new ParticleContainer(), new ParticleContainer());

  //   const setupAxis = (
  //     texture: Texture,
  //     amount: number,
  //     axis: "x"|"y",
  //     sprites: Sprite[],
  //     tweens: Tween<Sprite>[],
  //     positions: Array<{[x: string] :number}|{[y: string] :number}>
  //   ) => {

  //     // Lines will handle their own wrapping logic.
  //     // const bound = this.grid.bound;
  //     // Lowerbound[0], Upperbound[1]
  //     // const lower = bound[axis].lower;
  //     // const upper = bound[axis].upper;

  //     // Resize arrays to the expected amount
  //     // sprites.length
  //     //   = tweens.length
  //     //     = positions.length
  //     //       = amount;

  //     for (let i= 0; i < amount; i++) {
  //       // Line sp rite
  //       const line = sprites[i] = Sprite.from(texture);

  //       // An object with compatible properties for this sprite
  //       // to interpolate towards
  //       const target = positions[i] = {[axis]: 0};

  //       //
  //       // A tween handles getting the line to the target
  //       tweens[i] =
  //         new Tween(line)
  //           // Prevent Tween from stopping automatically
  //           .repeat(Infinity)
  //           // Instead check if it should stop
  //           .onRepeat((line: Sprite, rcount: number, tween: Tween<Sprite>) => {
  //             const panning = this.event_info.panning;
  //             // If the grid is panning, the destination can change arbitrarily
  //             // If the destination hasn't been reached, then move there
  //             if ( panning || line[axis] !== target[axis] ) {
  //               // Restart forces the onStart callback which sets this tween's
  //               // from and to values
  //               tween.restart();
  //             }
  //             else {
  //               // Otherwise this tween is done and will be restarted elsewhere
  //               tween.stop();
  //             }
  //         }) // NOTE: Attempting with dynamicTo | NOTE:It worked well
  //         // .onUpdate((line: Sprite, elapsed: number, tween: Tween<Sprite>) => {
  //         //   // Past the lower boundary
  //         //   if ( line[axis] < lower || line[axis] > upper) {
  //         //     // Move line and target to opposite side
  //         //     const from = line[axis] =  Math.floor(this._wrap(line[axis], lower, upper));
  //         //     const to = target[axis] = Math.floor(this._wrap(target[axis], lower, upper));
  //         //     // Force update destination // TODO COmpare floor to round and in onStart callback
  //         //     tween.from({[axis]: from}).to({[axis]: to}, 1-elapsed);
  //         //   }
  //         // })
  //         .onUpdate((line: Sprite, elapsed: number, tween: Tween<Sprite>) => {
  //           // Past the lower boundary
  //           if ( line[axis] < lower || line[axis] > upper) {
  //             // Move line and target to opposite side
  //             const from = line[axis] =  Math.floor(this._wrap(line[axis], lower, upper));
  //             const to = target[axis] = Math.floor(this._wrap(target[axis], lower, upper));
  //             // Force update destination // TODO COmpare floor to round and in onStart callback
  //             tween.from({[axis]: from});
  //           }
  //         })
  //         .onStart((line: Sprite, tween: Tween<Sprite>) => { //TODO debug :)
  //           // When this tween starts, ensure its from is the sprite's current value
  //           // and its destination is the property stored in the adjacent array
  //           const from = line[axis] =  Math.floor(this._wrap(line[axis], lower, upper));
  //           const to = target[axis] = Math.floor(this._wrap(target[axis], lower, upper));
  //           tween.from({[axis]: from})
  //             .dynamicTo({[axis]: to}, this.line_catchup);
  //         }
  //         // .onStart((line: Sprite, tween: Tween<Sprite>) => { //TODO debug :)
  //         //   // When this tween starts, ensure its from is the sprite's current value
  //         //   // and its destination is the property stored in the adjacent array
  //         //   const from = line[axis] =  Math.floor(this._wrap(line[axis], lower, upper));
  //         //   const to = target[axis] = Math.floor(this._wrap(target[axis], lower, upper));
  //         //   tween.from({[axis]: from}).to({[axis]: to}, this.line_catchup);
  //         // }
  //       );
  //     }
  //   }



  //   // Evaluate how many lines are needed to satisfy this display at the minimal scale.
  //   const max_vertical_lines = this._measureLineNeed(this.view.width, this.zoom.min);
  //   const max_horizontal_lines = this._measureLineNeed(this.view.height, this.zoom.min);

  //   setupAxis( // Set up Y axis
  //     textures.vertical_line,
  //     max_vertical_lines,
  //     "x",
  //     this._vertical_lines,
  //     this._vertical_interpolation,
  //     this._vertical_axes
  //   );
  //   setupAxis( // Set up X axis
  //     textures.horizontal_line,
  //     max_horizontal_lines,
  //     "y",
  //     this._horizontal_lines,
  //     this._horizontal_interpolation,
  //     this._horizontal_axes
  //   );

  //   const first_vertical = this._vertical_lines[0];
  //   first_vertical.x = this.view.width/2;
  //   (this.children[1] as Container).addChild(first_vertical);
    
  //   const first_horizontal = this._horizontal_lines[0];
  //   first_horizontal.y = this.view.height/2;
  //   (this.children[2] as Container).addChild(first_horizontal);
  // }

  /**
   * Called when lines need to be added, removed, or shifted
   * in response to some event
   * 
   * Managing lines. First question: How many will fit?
   * Second question: how will they appear?
   * Third question: how will they disappear?
   * 
   * @param focal the point at which transformations should occur
   *              Defaults to screen center
   */
  // _emplaceLines(focal: Required<{x:number, y:number}> = {x: this.view.width/2, y: this.view.height/2}) {



  //   // The offscreen boundaries describe when a line should wrap to the opposite side


    

  //   const manageContainer = (
  //     container: Container<Sprite>,
  //     reservoir: Sprite[],
  //     targets: Array<{[x:string]:number}|{[y:string]:number}>,
  //     dimension: number,
  //     axis: "x"|"y",
  //     tweens: Array<Tween<Sprite>>
  //     ): boolean => {

  //     const children = container.children;

  //     const current_gap = this._calculateCellSize() + this.line_size;
  //     const desired_gap = this._calculateCellSize(this.zoom.target) + this.line_size;

  //     const current_amount = children.length || 1;
  //     const desired_amount = this._measureLineNeed(dimension, this.zoom.target) || 1;

  //     // TODO Refactor bounds to be x, y, upper lower
  //     const current_range = this._measureLineNeed(dimension) * current_gap;
  //     const desired_range = desired_amount * desired_gap;
      


  //     if ( current_amount < desired_amount ) {
  //       // More lines needed.
  //       let lowest_line = children[0],
  //           highest_line = children[0];
  //       for (let i = 0; i < current_amount; i++) {
  //         if ( lowest_line[axis] > children[i][axis] ) lowest_line = children[i];
  //         if ( highest_line[axis] < children[i][axis]) highest_line = children[i];
  //       }
        

  //     }
  //     else if ( current_amount > desired_amount ) {
  //       // If REMOVING lines, then the current display must be reorganized such
  //       // that exiting lines are those that will be moving offscreen
        
  //     }

  //     // Find the index of the line closest to the focal point
  //     let index_zero = 0;
  //     let push_left_from_focal = 0;
  //     for (let i = 0; i < current_amount; i++) {
  //       // Distance of the focal point to a line
  //       const distance = focal[axis] - children[i][axis];
  //       // Focal point is to the right of the line
  //       // and the line is the closest to the left
  //       if ( distance > 0 && distance < current_gap ) {
  //         index_zero = i;
  //         push_left_from_focal = distance / this.zoom.target;
  //         break;
  //       }
  //     }
  //     // REVISE think of a better way to figure this out
  //     // Need to count the offset of the first major from the zero index of
  //     // the coming setup
  //     // let line_major_index_offset = 0;
  //     // for (let counter = 0; counter < this.interval; counter++) {
  //     //   const i = this._wrap(index_zero + counter, 0, current_amount);
  //     //   if ( children[i].tint === this.color.line_major ) {
  //     //     break;
  //     //   }
  //     //   line_major_index_offset--;
  //     // }

  //     const old_lb = (dimension - current_range) / 2;
  //     const old_ub = (dimension + current_range) / 2;

  //     const lb = this.grid.bound[axis].lower = (dimension - desired_range) / 2;
  //     const ub = this.grid.bound[axis].upper = (dimension + desired_range) / 2;

  //     // Zooming out
  //     // REVISE Make it so positioning is based on a scalar of the difference
  //     // between the focal point and the zero'th index. Floor division of the
  //     // difference in distance and multiply  by desired gap
  //     if ( current_gap >= desired_gap ) {
  //       // Where the furthest left line is placed
  //       const first_position = (children[index_zero][axis] - old_lb) % current_gap + old_lb;
  //       // Where the furthest left line is placed next
  //       const next_position = (children[index_zero][axis] - lb) % desired_gap + lb;
  //       for ( let counter = 0; counter < desired_amount; counter++ ) {
  //         // Iteration wrapped
  //         const i = this._wrap(index_zero + counter, 0, desired_amount);

  //         // Get the line
  //         const line = i < children.length
  //                     ? children[i]
  //                     : container.addChild(reservoir[children.length]);
  //         const target = targets[i];
  //         // Set tint
  //         // line.tint = (i + line_major_index_offset) % this.interval
  //         line.tint = i % this.interval
  //                   ? this.color.line_minor
  //                   : this.color.line_major;

  //         // Where this lne "should" be
  //         const current_position = Math.floor(first_position + counter * current_gap);
  //         const desired_position = Math.floor(next_position + counter * desired_gap);
  //         line[axis] = current_position;
  //         target[axis] = desired_position;
  //       }
  //     }
  //     // TODO Stop all tweens, start all tweens
  //     for (let i = 0; i < desired_amount; i++) {
  //       tweens[i].restart();
  //     }

  //     return true;
  //   }

  //   // const current_amount = container.children.length;
  //   // let difference;
  //   // if ( current_amount < needed_amount ) {
  //   //   // Not enough lines
  //   //   // Difference is the added array
  //   //   difference = reservoir.slice(current_amount, needed_amount);
  //   //   container.addChild(...difference);
  //   // }
  //   // else if ( current_amount > needed_amount ) {
  //   //   // Too many lines, remove the excess
  //   //   // The difference is the removed array.
  //   //   difference = container.removeChildren(needed_amount) as Array<Sprite>;
  //   // }
  //   // // Since the lines as they appear in the container's children array can be in
  //   // // any arbitrary order regardless of their on screen position, the difference
  //   // // is the lines that should not be positioned centermost
  //   // return container.children as Array<Sprite>;
    

  //   const vertical_line_container = this.children[1] as Container<Sprite>;
  //   const horizontal_line_container = this.children[2] as Container<Sprite>;
  //   manageContainer(
  //     vertical_line_container,
  //     this._vertical_lines,
  //     this._vertical_axes,
  //     this.width,
  //     "x",
  //     this._vertical_interpolation
  //   );
  //   manageContainer(
  //     horizontal_line_container,
  //     this._horizontal_lines,
  //     this._horizontal_axes,
  //     this.height,
  //     "y",
  //     this._horizontal_interpolation
  //   );

  //   new Tween(this.zoom)
  //     .from({actual: this.zoom.actual})
  //     .to({target: this.zoom.target})
  //     .start();
  // }
}
