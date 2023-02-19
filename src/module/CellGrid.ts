import { Application, Container, FederatedPointerEvent, Graphics, ParticleContainer, Point, Sprite, Texture } from "pixi.js";
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

  public color = {
    background: 0x222222,
    line_major: 0xffffff,
    line_minor: 0x888888,
    cell: 0xffff00
  };

  /** @type {Renderer} */
  public renderer;

  /** @type {Rectangle} */
  public view;

  /** Pixel sizes */
  public cell_size = 24;
  public line_size = 1;
  public line_catchup = 50; // ms

  /** Ratio of minor to major axis lines */
  public interval = 5;
  
  /** Grid info */
  public grid = {
    bound: {
      up: 0,
      down: 0,
      left: 0,
      right:0
    },
    offset: {x: 0, y: 0}
  } 
  
  /** Zoom (scale) directives */
  public zoom = {
    min: 0.1,
    max: 5.0,
    target: 1.0,
    actual: 1.0
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

    this.renderer = app.renderer;
    this.view = app.screen;

    this._generateAssets();
    this._emplaceAssets({x: this.view.width/2, y: this.view.height/2} as Point);
    
    app.ticker.add((dt) => {
      Group.shared.update(dt, true);
    })

    this.on("added", ()=> {

    })

    this.interactive = true;
    this.cursor = 'pointer';
    this.on('pointerdown', this._onPointerDown);
    this.on('pointerup', this._onPointerUp);

    // TODO: Place this into mousewheel listener
    // this.event_info.snapback = (this.cell_size+1) * this.interval;
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
  }

  _onPointerUp(e: FederatedPointerEvent) {
    
  }

  update(cell_data: CellMap) {
    
  }

  _generateTextures(): TextureDict {
    const view = this.view;
    const renderer = this.renderer;
    const color = this.color;

    // Create graphics elements
    
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
      g.lineStyle({width: this.line_size, color: this.color.line_major, alpha: 1});
      g.lineTo(x, y);
      const texture = renderer.generateTexture(g);
      g.destroy();
      // texture.defaultAnchor.set(0.5);
      return texture;
    };

    return {
      background: rectHelper(color.background, view.width, view.height),
      cell: rectHelper(color.cell, 100),
      vertical_line: lineHelper(0, view.height),
      horizontal_line: lineHelper(view.width, 0)
    };
  }

  _calculateCellSize(scalar?: number) {
    return this.cell_size * (scalar || this.zoom.actual)
  }

  /**
   * @param size in pixels of visible space
   * @param scalar optional scaling of cell size
   * @returns the amount of lines needed to fill the screen once past the edge
   *          + the difference of its remainder against the interval
   */
  _measureLineNeed(size: number, scalar?: number): number {
    const div = Math.ceil(size / (this._calculateCellSize(scalar) + this.line_size));
    const rem = this.interval - (div % this.interval);
    return div + rem;
  };

  _vertical_lines = new Array<Sprite>();
  _vertical_axes = new Array<Pick<Sprite,"x">>();
  _vertical_interpolation = new Array<Tween<Sprite>>();
  _horizontal_lines = new Array<Sprite>();
  _horizontal_axes = new Array<Pick<Sprite,"y">>();
  _horizontal_interpolation = new Array<Tween<Sprite>>();

  _generateAssets() {
    const textures = this._generateTextures();
    
    // clear this container
    this.children.forEach((obj) => obj.destroy());

    // new resized background, new line containers
    this.addChild(Sprite.from(textures.background), new ParticleContainer(), new ParticleContainer());

    // All lines that can be displayed are created at this time.
    const max_vertical_lines = this._measureLineNeed(this.view.width, this.zoom.min);
    const max_horizontal_lines = this._measureLineNeed(this.view.height, this.zoom.min);
    // Adjacent arrays for indexing sprite, tweens, and destination references in tandem
    this._vertical_lines.length
      = this._vertical_axes.length
        = this._vertical_interpolation.length
          = max_vertical_lines;
    this._horizontal_lines.length
      = this._horizontal_interpolation.length
        = this._horizontal_axes.length
          = max_horizontal_lines;

    for (let i = 0; i < max_vertical_lines; i++) {
      const line = Sprite.from(textures.vertical_line);
      if ( i % this.interval ) line.tint = this.color.line_minor;
      // Sprite array
      this._vertical_lines[i] = line;
      // An object with similar properties to Sprite is instantiated
      // to act as a handle for the destination of this line's Tween.
      const destination = this._vertical_axes[i] = {x: 0};
      // This Tween will, when active, attempt to match the line's x property
      // to the x property stored in properties
      this._vertical_interpolation[i] =
        new Tween(line)
          // Once started keep going
          .repeat(Infinity)
          .onRepeat((line: Sprite, rcount: number, tween: Tween<Sprite>) => {
            const panning = this.event_info.panning;
            // If the grid is panning, the destination is likely to change,
            // so might as well keep active. Otherwise, if the destination has been 
            // changed, move there.
            if ( panning || line.x !== destination.x ) {
              tween.restart();
            }
            else {
              // Nothing to do so stop, will be restarted by another event.
              tween.stop();
            }
          })
          .onStart((line: Sprite, tween: Tween<Sprite>) => {
            // Set the start location 
            tween.from({x: line.x}).to({x: destination.x}, this.line_catchup);
          }
        );
      // First draw originates from the center
      line.x = this.view.width/2;
    }
    for(let i = 0; i < max_horizontal_lines; i++) {
      const line = Sprite.from(textures.horizontal_line);
      if ( i % this.interval ) line.tint = this.color.line_minor;
      this._horizontal_lines[i] = line;
      const destination = this._horizontal_axes[i] = {y: 0};
      this._horizontal_interpolation[i] =
        new Tween(line)
        .repeat(Infinity)
        .onRepeat((line: Sprite, rcount: number, tween: Tween<Sprite>) => {
          const panning = this.event_info.panning;
          if ( panning || line.y !== destination.y ) {
            tween.restart();
          }
          else {
            tween.stop();
          }
        })
        .onStart((line: Sprite, tween: Tween<Sprite>) => {
          tween.from({y: line.y}).to({y: destination.y}, this.line_catchup);
        }
      );
      line.y = this.view.height/2;
    }
  }
  
  _emplaceAssets(origin: Point|undefined) {
    this._emplaceLines(origin);
    // this._emplaceCells(origin);
  }

  /**
   * Adjust the amount of sprites present in this container
   * and modify their position to reflect the cell size.
   * @param focal the point at which transformations should occur
   *              If left blank defaults to screen center
   */
  _emplaceLines(focal?: Pick<Point,"x"|"y">) {
    // This initially occurs for grid generation, but also happens
    // whenever the scale of the scene changes -- i.e. zooming in or out
    if (! focal ) {
      // In the case its an initial placement we'll use the screen center
      focal = {
        x: this.view.width/2,
        y: this.view.height/2
      } as Point;
    }

    // Containers
    const vertical_lines = this.children[1] as ParticleContainer;
    const horizontal_lines = this.children[2] as ParticleContainer;

    // Manage amount of displayed assets, returns Container's children property
    const manageContainer = (container: Container, reservoir: Sprite[], needed_amount: number): Array<Sprite> => {

      const current_amount = container.children.length;
      if ( current_amount < needed_amount ) {
        // Not enough lines, get the indices residing in the difference
        container.addChild(
          ...reservoir.slice(current_amount, needed_amount)
        );
      }
      else if ( current_amount > needed_amount ) {
        // Too many lines, remove the excess
        container.removeChildren(needed_amount)
          // and mark those removed as invalidly positioned
          .forEach(obj => obj.visible = false)

      }
      
      return container.children as Array<Sprite>;
    }
    
    
    // Predicate callback to find the first line within a radius
    const nearest = (
      obj: Pick<Point,"x"|"y">,
      comparison: Pick<Point,"x"|"y">,
      property: "x"|"y",
      search_radius: number
    ) => Math.abs(obj[property] - comparison[property]) < search_radius

    // Total lines that will be in each container
    const vertical_line_need = this._measureLineNeed(this.view.width, this.zoom.target);
    const horizontal_line_need = this._measureLineNeed(this.view.height, this.zoom.target);

    //The first line to be modified is decided as the closest line to the focal point on screen.
    const radius = this._calculateCellSize(this.zoom.actual)/2;

    // The transformation of already present lines is dependent on the transformation of the first
    // line modified. If no lines have been transformed yet, index is set to 0.
    const v_start = Math.max(
      manageContainer(vertical_lines, this._vertical_lines, vertical_line_need)
      .findIndex(line => line.visible && nearest(line, focal!, "x", radius)),
      0
    );
    const h_start = Math.max(
      manageContainer(horizontal_lines, this._horizontal_lines, horizontal_line_need)
      .findIndex(line => line.visible && nearest(line, focal!, "y", radius)),
      0
    );

    // The distance between each line origin point in this setup
    const gap = this._calculateCellSize(this.zoom.target) + this.line_size;
    // Store the distance each axis spans
    const lateral_range = vertical_line_need * gap;
    const vertical_range = horizontal_line_need * gap;

    // Boundaries describe edges that lines should not exist past. Boundaries are
    // decided by taking the difference and sum between the range each axis spans and
    // the dimension of the visible screen corresponding to it. The average of these
    // two resolve edges that centers the visible screen within the range.
    const lb = this.grid.bound.left = Math.floor((this.view.width - lateral_range) / 2);
    const rb = this.grid.bound.right = Math.floor((this.view.width + lateral_range) / 2);
    const ub = this.grid.bound.up = Math.floor((this.view.height- vertical_range) / 2);
    const db = this.grid.bound.down = Math.floor((this.view.height + vertical_range) / 2);

    // Wrap a value between two numbers, inclusive [e.g wrap(10, 3, 7) == 5]
    const wrap = (val: number, min: number, max: number): number => val % (max+1-min) + min;
    let next_x =
      // The starting position is that of the closest line to the origin
      vertical_lines.children[v_start].x
      // Shifted by the difference from the focal point
      - (vertical_lines.children[v_start].x - focal.x)
      // scaled by the current target zoom
      * this.zoom.target
      // pushed forward by the preceeding boundary edge
      - lb;
    for (let offset = v_start; offset < v_start + vertical_line_need; offset++) {
      // The current index is extrapolated by wrapping the offset
      const i = wrap(offset, 0, vertical_line_need-1);

      const line = this._vertical_lines[i];
      // Wrapped between the bounds
      const destination = this._vertical_axes[i].x = wrap(next_x, lb, rb);

      if (! line.visible ) {
        line.visible = true;
        // If the line was just added then its initial position
        // is set to the nearest offscreen boundary to its next position
        line.x = Math.round((destination - lb) / lateral_range)
                ? rb // 1
                : lb // 0
      }
      // Setting the next position for this line

      // A callback inside of the tween will automatically refresh
      // the destination target and duration
      this._vertical_interpolation[i].start();

      // The next x position is incremented by the current gap size
      next_x += gap;
    }
    // Same is done for horizontal lines
    let next_y = horizontal_lines.children[h_start].y
            - (horizontal_lines.children[h_start].y - focal.y)
            * this.zoom.target
            - ub;
    for (let offset = h_start; offset < h_start + horizontal_line_need; offset++) {
      const i = wrap(offset, 0, horizontal_line_need-1);

      const line = this._horizontal_lines[i];
      const destination = this._horizontal_axes[i].y = wrap(next_y, ub, db);

      if (! line.visible ) {
        line.visible = true;
        line.y = Math.round((destination - ub) / vertical_range)
                ? db // 1
                : ub // 0
      }
      this._horizontal_interpolation[i].start();
      next_y += gap;
    }
  }
}
