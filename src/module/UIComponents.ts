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
import runtime_palette from "../CellColorPallette";

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

  private pattern: Array<Boolean> = [];

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

  /**
   * When this display is rebuilt (texture redraw or pattern change) it changes the
   * size of the capturing container. This may cause this container to escape its emplacement
   * in the layout, so an invocation outside this class is required to ensure it is fixed
   * as it happens.
   * @param func callback to a layout resize method
   */
  public onBuildDisplay(func: () => void) {
    this.buildDisplayCallback = func;
  }

  public setRoot(new_root: number) {
    if (new_root < 1) new_root = 1;
    if (new_root % 2 !== 1) new_root++;

    this.root = new_root;
    this.buildDisplay();
  }

  /**
   * Return true if the pattern in the UI differs from the recorded pattern.
   * @returns true if modified
   */
  public get modifiedSinceLastRead() {
    const {pattern_controller, pattern} = this;
    if ( pattern_controller.children.length !== pattern.length ) return true;
    const current_pattern = pattern_controller.children.map((checkbox) => (checkbox as CheckBox).checked);
    for (let i = 0; i < pattern.length; i++) {
      if (current_pattern[i] !== pattern[i]) return true;
    }
    return false;
  }

  public getPattern(): Boolean[] {
    const {pattern_controller, pattern} = this;
    const new_pattern = pattern_controller.children.map((checkbox) => (checkbox as CheckBox).checked);
    return this.pattern = new_pattern;
  }
}

export class RuleController {

  private asset_man: AssetManager;

  private input_container = new Container();
  private values = new Array<number>();

  constructor(asset_manager: AssetManager) {
    this.asset_man = asset_manager;
    this.build();
  }

  public build() {
    const {asset_man, input_container} = this;

    input_container.removeChildren
    const {text_input_active, text_input_inactive} = asset_man.get('text_input');
    // Source says I can't change this yet.

    const input_sprite = new Sprite(text_input_active);

    const input = new Input({
      align: 'left',
      bg: input_sprite,
      textStyle: {
        fill: runtime_palette.user_menu.text_active,
      },
      padding: 20
    });

    input.onChange.connect(() => {
      const raw_string = input.value;
      const raw_array = raw_string.split(',');
      const values = new Array<number>();
      let valid = true;
      for (const parseable of raw_array) {
        try {
          const num = Number(parseable.trim());
          values.push(num);
        } catch(e) {
          valid = false;
          break;
        }
      }
      if ( valid ) this.values = values;
    });
    input_container.addChild(input);
  }

  public getContent() {
    return this.input_container;
  }

  public getInput() {
    return this.values;
  }
}

export class UpdateController {
  private asset_man: AssetManager;

  private step_container = new Container();
  private auto_container = new Container();
  private timing_container = new Container();

  private auto_enabled = false;
  // TPS = Ticks per Second
  private min_tps = 0.5;
  private max_tps = 5;
  private tps = 2;

  constructor(asset_manager: AssetManager) {
    this.asset_man = asset_manager;
    this.build();
  }

  public build() {
    this.buildStepButton();
    this.buildAutoButton();
    this.buildTimerSlider();
  }

  private buildStepButton() {
    const {asset_man, step_container} = this;
    step_container.removeChildren().forEach((button) => button.destroy());

    const step_textures = asset_man.get('step_button');
    const step_button = new FancyButton({
      defaultView: new Sprite(step_textures.step_button_default),
      pressedView: new Sprite(step_textures.step_button_pressed),
      // disabledView: need one of them
      text: "Step" // temp
    });
    // Add callback
    step_container.addChild(step_button);
  }

  private buildAutoButton() {
    const {asset_man, auto_container} = this;
    auto_container.removeChildren().forEach((button) => button.destroy());

    const {auto_button_on, auto_button_off} = asset_man.get('auto_button');
    // TODO: Deign new textures, turn this into a checkbox
    const auto_sprite = new Sprite(auto_button_off)
    const auto_button = new FancyButton({
      defaultView: auto_sprite,
      // pressedView: new Sprite(auto_textures.auto_button_off),
      text: 'Auto',
    });
    auto_button.onPress.connect(() => {
      const on = this.auto_enabled = !this.auto_enabled;
      auto_sprite.texture = on ? auto_button_on : auto_button_off;
    });
    auto_container.addChild(auto_button);
  }
    
  private buildTimerSlider() {
    const {asset_man, timing_container, min_tps, max_tps, tps} = this;
    timing_container.removeChildren().forEach((slider) => slider.destroy());

    const {slider_bg, slider_fg, slider_thumb} = asset_man.get('timer_slider');
    const timer_slider = new Slider({
      bg: new Sprite(slider_bg),
      fill: new Sprite(slider_fg),
      slider: new Sprite(slider_thumb),
      min: min_tps,
      max: max_tps,
      value: tps
    });
    timer_slider.onChange.connect(() => {
      this.tps = timer_slider.value;
    })
    // Slider only build horizontally, currently. This makes it appear vertical.
    timer_slider.angle = 270;
    timer_slider.y += timer_slider.width;
    this.timing_container.addChild(timer_slider);
  }

  public getContent(content: UpdateControllerContent):Content {
    if ( content === 'step_button' ) {
      return this.step_container;
    }
    if ( content === 'auto_button' ) {
      return this.auto_container;
    }
    if ( content === 'timer_slider' ) {
      return this.timing_container;
    }
    return {};
  }

  public get autoEnabled() {
    return this.auto_enabled;
  }

  public get timingRatio() {
    return this.tps;
  }
}