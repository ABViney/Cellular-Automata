import { Application, Container, FederatedPointerEvent, Graphics, ParticleContainer, Point, Sprite } from "pixi.js";
import { Group, Tween } from "tweedle.js";
// import { Cell, CellMap } from "./CellMap";

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

    
    generateGrid();
    
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
    const view = this.view;
    const renderer = this.renderer;

    // Create graphics elements
    const background_template = new Graphics();
    background_template.beginFill(this.color.background, 1);
    background_template.drawRect(0, 0, view.width, view.height);
    const background_texture = renderer.generateTexture(background_template);
    background_template.destroy();

    const lineHelper = (x:number, y:number) => {
      const g = new Graphics();
      g.lineStyle({width: this.line_size, color: this.color.line_major, alpha: 1});
      g.lineTo(x, y);
      const texture = renderer.generateTexture(g);
      g.destroy();
      // texture.defaultAnchor.set(0.5);
      return texture;
    };

    this.textures =  {
      background: background_texture,
      vertical_line: lineHelper(0, view.height),
      horizontal_line: lineHelper(view.width, 0)
    };
  }

  /**
   * @type {object}
   * @property 
   */
  public textures: object;

  _calculateCellSize(scalar?: number) {
    return this.cell_size * this.line_size * (scalar || this.zoom.actual)
  }

  _calculateLineNeed(size: number, scalar?: number): number {
    const div = Math.floor(size / this._calculateCellSize(scalar));
    const rem = this.interval - (div % this.interval);
    return div + rem;
  };

  _vertical_lines = new Array<Sprite>();
  _vertical_line_interpolation = new Group();
  _horizontal_lines = new Array<Sprite>();
  _horizontal_line_interpolation = new Group();

  _generateAssets() {
    const textures = this._generateGridTextures();
    
    // clear containers
    this.children.forEach((obj) => obj.destroy());

    this.addChild(Sprite.from(textures.background), new ParticleContainer(), new ParticleContainer());
    this._vertical_lines.length = 0;
    this._vertical_interpolation.removeAll();
    this._horizontal_lines.length = 0;
    this._horizontal_interpolation.removeAll();

    const number_of_vertical_lines = this._calculateLineNeed(this.view.width, this.zoom.min);
    for (let i = 0; i < number_of_vertical_lines; i++) {
      const line = Sprite.from(textures.vertical_line);
      if ( i % this.interval ) line.tint = this.color.line_minor;
      this._vertical_interpolation.add(new Tween(line));
      this._vertical_lines.push(line);
      line.visible = false;
    }
    const number_of_horizontal_lines = this._calculateLineNeed(this.view.height, this.zoom.min);
    for(let i = 0; i < number_of_horizontal_lines; i++) {
      const line = Sprite.from(textures.vertical_line);
      if ( i % this.interval ) line.tint = this.color.line_minor;
      this._vertical_interpolation.add(new Tween(line));
      this._vertical_lines.push(line);
      line.visible = false;
    }
  }

  _emplaceLines(origin: Point) {
    // Constants
    const gap = this.cell_size + this.line_size * this.zoom.current;
    const vertical_line_need = this._calculateLineNeed(this.view.width, this.zoom.current);
    const horizontal_line_need = this._calculateLineNeed(this.view.height, this.zoom.current);
    // Containers
    const vertical_lines = this.children[1] as ParticleContainer;
    const horizontal_lines = this.children[2] as ParticleContainer;
    // Shorthands 
    // Manage amount of displayable assets, returns children remaining in the container
    const manageContainer = (container: Container, reservoir: Sprite[], amount: number) => {
      if ( container.children.length < amount )
        container.addChild(
          ...reservoir.slice(container.children.length, amount)
        );
      else if ( container.children.length > amount )
          container.removeChildren(amount).forEach(obj => obj.visible = false)
      return container.children;
    }
    const nearest = (obj: any, property: string, comparison: number) => {
      return Math.abs(obj[property] - comparison) < gap;
    };
    // Set containers to needed amount, store index of starting position
    const v_lines = manageContainer(vertical_lines, this._vertical_lines, vertical_line_need)
    const v_start = v_lines.findIndex(line => line.visible && nearest(line, "x", origin.x));
    const h_lines = manageContainer(horizontal_lines, this._horizontal_lines, horizontal_line_need)
    const h_start = h_lines.findIndex(line => line.visible && nearest(line, "y", origin.y));
    // Describing boundaries for wrapping
    const lateral_range = vertical_line_need * gap;
    const vertical_range = vertical_line_need * gap;

    // Wrap a value between two numbers, inclusive [e.g wrap(10, 3, 7) == 5]
    const wrap = (val: number, min: number, max: number): number => val % (max+1-min) + min;
    // Boundary resets
    const lb = this.grid.bound.left = Math.floor(this.view.width/2 - vertical_range / 2);
    const rb = this.grid.bound.right = Math.floor(this.view.width/2 + vertical_range / 2);
    const ub = this.grid.bound.up = Math.floor(this.view.height/2 - lateral_range / 2);
    const db = this.grid.bound.down = Math.floor(this.view.height/2 + lateral_range / 2);
    // The starting position is that of the closest line to the origin
    let x = vertical_lines.children[v_start].x 
              // Shifted by the difference scaled by the zoom modifier
            - (vertical_lines.children[v_start].x - origin.x) * this.zoom.target
    for( const line of [...v_lines.slice(v_start), ...v_lines.slice(0, v_start)] ) {
      if (! line.visible ) {
        line.visible = true;
      }
      line.x = Math.round(x/this.view.width)
              ? this.grid.bound.right
              : this.grid.bound.left;
      x += gap;
      if ( x > this.grid.bound.right) x -= lateral_range
    }
    
    
  }
}
