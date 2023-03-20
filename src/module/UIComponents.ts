/**
 * I'm still figuring out the shortcomings of the Pixi/Layout and Pixi/UI modules
 * My current solution for the rigidity of both extensions post object construction 
 * is to supply containers I manage to the Layout class and handle the UI components
 * inside these containers. This will enable me to add/remove components at will while
 * avoiding the hierarchical headache Pixi/Layout appears to be.
 * 
 * -- NOTE: March 15, 2023 10:28
 * -------- Two hours ago Patch 0.6.2 was released for Pixi/UI
 * ------------ Relevant changes: 2 incremements in less than an hour--Slider fixes
 *                UI/Layout is now UI/List (Glad I don't have to work around that anymore)
 *                This version isn't set as the npm default, may need to revert if it's problematic
 *                
 * -------- Around the same time Patch 0.1.2 was released for Pixi/Layout
 * ------------ Relevant changes: Margins should be fixed,
 *                minWidth and minHeight properties (woo!)
 *                Anchor properties (potential "woo!", not applicable in user menu)
 *                addContent method for Layout (would "woo!" if I wasn't working around it already)
 *                public getByID method for ContentController*.
 *                  *This wasn't listed in the patch notes--Don't know if it works yet.
 *                   Can be accessed via Layout.content.getByID(id:string)
 * -------- PixiJS updated to 7.2.0 yesterday. Didn't find a changelog, but all commits appear to be
 *            low-level fixes that shouldn't affect my work.
 * Updating libs:
 *  "@pixi/layout": 0.1.1 --> 0.1.2
 *  "@pixi/ui": 0.5.8 --> 0.6.2
 *  "pixi.js": 7.1.1 --> 7.2.0
 */
import { CheckBox, FancyButton, Input, Slider } from "@pixi/ui";
import { Content } from "@pixi/layout";
import { Container, RenderTexture, Sprite, Texture } from "pixi.js"
import AssetManager from "./CellAssets";

type NeighborhoodContent = "pattern_controller"|"range_up"|"range_down";
type UpdateControllerContent = "step_button"|"auto_button"|"timer_slider";

export class NeighborhoodController {
  private asset_man: AssetManager;

  private pattern_controller = new Container();
  // private range_up!: FancyButton;
  // private range_down!: FancyButton;
  private range_up = new Container();
  private range_down = new Container();

  private max_root = 9; // Max cells { 81 }
  private root = 3;
  private pattern_cells: Array<CheckBox[]> = [];

  constructor(asset_manager:AssetManager) {
    this.asset_man = asset_manager;
    this.build();
  }
  public build() {
    this.buildPatternCells();
    this.buildRangeButtons();
    this.buildDisplay();
  }

  getContent(content: NeighborhoodContent):Content {
    if ( content === 'pattern_controller' ) {
      return this.pattern_controller;
    }
    else if ( content === 'range_up' ) {
      return this.range_up;
    }
    else if ( content === 'range_down' ) {
      return this.range_down;
    }
    return "Content not found";
  }

  /**
   * An initial build 
   */
  private buildPatternCells() {
    const {max_root, pattern_cells} = this;

    const {center_cell_off, center_cell_on, neighbor_cell_off, neighbor_cell_on} = this.asset_man.get('pattern_cell');
    const center = (max_root-1)/2;

    for (let row = 0; row < max_root; row++) {
      pattern_cells.push([]);
      for (let col = 0; col < max_root; col++) {
        const new_cell = new CheckBox({
          style: {
            checked: new Sprite(neighbor_cell_on),
            unchecked: new Sprite(neighbor_cell_off)
          },
          checked: true
        });
        pattern_cells[row].push(new_cell);
      }
    }
    // Replacing the center textures
    const center_checkbox = pattern_cells[center][center];
    (center_checkbox.innerView.getChildAt(0) as Sprite).texture = center_cell_off;
    (center_checkbox.innerView.getChildAt(1) as Sprite).texture = center_cell_on;
    center_checkbox.checked = false;
  }

  private buildRangeButtons() {
    const {range_button_bg, range_button_down_decal, range_button_up_decal} = this.asset_man.get('range_buttons');
    
    // Buttons
    const range_down = new FancyButton({
      defaultView: new Sprite(range_button_bg),
      icon: new Sprite(range_button_down_decal)
    });
    const range_up = new FancyButton({
      defaultView: new Sprite(range_button_bg),
      icon: new Sprite(range_button_up_decal)
    });
    
    // Listeners
    // If the root is changed, the pattern_container is remodeled
    range_up.onPress.connect(() => {
      this.root += 2;
      if (this.root > this.max_root) this.root = this.max_root;
      else this.buildDisplay();
    });
    range_down.onPress.connect(() => {
      this.root -= 2;
      if (this.root < 0) this.root = 1;
      else this.buildDisplay();
    });
    
    this.range_up.removeChildren();
    this.range_up.addChild(range_up);
    this.range_down.removeChildren();
    this.range_down.addChild(range_down);
  }

  private buildDisplay() {
    const {root, max_root, pattern_cells, pattern_controller} = this;
    const center = (max_root-1) / 2;
    const radius = (root-1)/2;

    pattern_controller.removeChildren();
    
    const size = pattern_cells[0][0].width;
    const gap = 10;

    const start = center - radius;
    const end = center + radius;
    for (let row = start; row <= end; row++) {
      const y = (row-start) * (size+gap);

      for (let col = start; col <= end; col++) {
        const x = (col-start) * (size+gap);
        const cell = pattern_controller.addChild(pattern_cells[row][col]);
        cell.x = x;
        cell.y = y;
      }
    }

    if ( this.buildDisplayCallback ) this.buildDisplayCallback();
  }

  private buildDisplayCallback?: () => void;

  public onBuildDisplay(func: () => void) {
    this.buildDisplayCallback = func;
  }

  public setRoot(new_root: number) {
    if (new_root < 1) new_root = 1;
    if (new_root % 2 !== 1) new_root++;

    this.root = new_root;
    this.buildDisplay();
  }

  public getPattern(): Boolean[] {
    const {root, max_root, pattern_cells} = this;
    const center = (max_root-1) / 2;
    const radius = (root-1)/2;
    const start = center - radius;
    const end = center + radius;
    const pattern = [];
    for (let row = start; row <= end; row++) {
      for (let col = start; col <= end; col++) {
        pattern.push(pattern_cells[row][col].checked);
      }
    }
    return pattern;
  }
}

export class RuleController {

  private asset_man: AssetManager;

  private input_active: RenderTexture;
  private input_inactive: RenderTexture;

  private input: Input;

  constructor(asset_manager: AssetManager) {
    this.asset_man = asset_manager;

    const input_textures = asset_manager.get('text_input');
    this.input_active = input_textures.text_input_active;
    this.input_inactive = input_textures.text_input_inactive;

    this.input = new Input({
      align: 'left',
      bg: new Sprite(asset_manager.get('text_input').text_input_inactive),
      textStyle: {
        fill: 0xffffff,
      },
      padding: 20
    })
  }

  public getContent() {
    return this.input;
  }

  public getInput() {
    return this.input.value;
  }
}

export class UpdateController {
  private asset_man: AssetManager;

  private step_button: FancyButton;
  private auto_button: FancyButton;
  private timing_container = new Container();
  private timing_slider: Slider;

  constructor(asset_manager: AssetManager) {
    this.asset_man = asset_manager;

    const step_textures = asset_manager.get('step_button');
    this.step_button = new FancyButton({
      defaultView: new Sprite(step_textures.step_button_default),
      pressedView: new Sprite(step_textures.step_button_pressed),
      // disabledView: need one of them
      text: "Step" // temp
    });

    const auto_textures = asset_manager.get('auto_button');
    let auto_enabled_texture = auto_textures.auto_button_on;
    this.auto_button = new FancyButton({
      defaultView: new Sprite(auto_textures.auto_button_off),
      // pressedView: new Sprite(auto_textures.auto_button_off),
      text: 'Auto',
    });
    this.auto_button.onPress.connect(() => {
      
    })


    const slider_textures = asset_manager.get('timer_slider');
    this.timing_slider = new Slider({
      bg: new Sprite(slider_textures.slider_bg),
      fill: new Sprite(slider_textures.slider_fg),
      slider: new Sprite(slider_textures.slider_thumb),
      min: 1,
      max: 5,
      value: 2
    });
    this.timing_slider.angle = 270;
    this.timing_slider.y += this.timing_slider.width;
    this.timing_container.addChild(this.timing_slider);
  }

  public getContent(content: UpdateControllerContent):Content {
    if ( content === 'step_button' ) {
      return this.step_button;
    }
    if ( content === 'auto_button' ) {
      return this.auto_button;
    }
    if ( content === 'timer_slider' ) {
      return this.timing_container;
    }
    return {};
  }
}