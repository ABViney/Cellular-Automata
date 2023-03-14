import { Graphics, Renderer, RenderTexture } from "pixi.js";
import palette from "../CellColorPallette";

/**
 * Type hinting to save me from myself
 */
type PatternCell = {
  center_cell_off: RenderTexture;
  center_cell_on: RenderTexture;
  neighbor_cell_off: RenderTexture;
  neighbor_cell_on: RenderTexture;
};
type RangeButtons = {
  range_button_bg: RenderTexture;
  range_button_up_decal: RenderTexture;
  range_button_down_decal: RenderTexture;
};
type TextInput = {
  text_input_inactive:RenderTexture;
  text_input_active:RenderTexture;
};
type TimerSlider = {
  slider_bg:RenderTexture;
  slider_fg:RenderTexture;
  slider_thumb:RenderTexture;
};
type StepButton = {
  step_button_default:RenderTexture;
  step_button_pressed:RenderTexture;
};
type AutoButton = {
  auto_button_off:RenderTexture;
  auto_button_on:RenderTexture;
};

type AssetGroup = PatternCell|RangeButtons|TextInput|TimerSlider|StepButton|AutoButton;
interface AssetMap {
  pattern_cell?: PatternCell;
  range_buttons?: RangeButtons;
  text_input?: TextInput;
  timer_slider?: TimerSlider;
  step_button?: StepButton;
  auto_button?: AutoButton;
};
type RefreshFunctionGroup = {
  [K in keyof AssetMap]: () => void;
};

export default class AssetManager {

  private renderer: Renderer;
  private graphics: Graphics;
  
  /**
   * All rendered assets this app needs
  */
 private assets: AssetMap = {};
 private loaded = false;

  /**
   * Instantiated with a rendering context.
   */
  constructor(renderer: Renderer) {
    this.renderer = renderer;
    this.graphics = new Graphics();
    this.refresh();
  }

  /**
   * @returns if this class is still drawing
   */
  public isLoaded():boolean {
    return this.loaded;
  }

  /**
   * Redraw functions are aggregated in a later function
   */

  // Aggregate
  private refreshFunctions:RefreshFunctionGroup = {
    pattern_cell: this.refreshPatternCells,
    range_buttons: this.refreshRangeButtons,
    text_input: this.refreshTextInput,
    timer_slider: this.refreshSlider,
    step_button: this.refreshStepButton,
    auto_button: this.refreshAutoButton
  };
  
  /**
   * Getter
   */
  public get(asset_type: keyof AssetMap):AssetGroup {
    return this.assets[asset_type]!;
  }

  /**
   * Request redraw of component textures
   * If target is null, redraws all 
   * @param targets 
   */
  public refresh(target?:keyof AssetMap) {
    this.loaded = false;

    if ( target ) this.refreshFunctions[target]!();
    else 
      for (const func of Object.values(this.refreshFunctions))
        func();

    this.loaded = true;
  }

  /**
   * Private
   */
  private refreshPatternCells() {
    const on_color = palette.grid.cell;
    const center_off_color = palette.user_menu.center_cell_off;
    const neighbor_off_color = palette.user_menu.neighbor_cell_off;
    const size = 100; // TODO: add an external reference to an object with sizing fields

    const {assets, graphics, renderer} = this;
    
    graphics.clear().beginFill(on_color).drawRect(0,0,size,size).endFill();
    const center_cell_on = renderer.generateTexture(graphics);
    graphics.clear().beginFill(center_off_color).drawRect(0,0,size,size).endFill();
    const center_cell_off = renderer.generateTexture(graphics);

    graphics.clear().beginFill(on_color).drawRect(0,0,size,size).endFill();
    const neighbor_cell_on = renderer.generateTexture(graphics);
    graphics.clear().beginFill(neighbor_off_color).drawRect(0,0,size,size).endFill();
    const neighbor_cell_off = renderer.generateTexture(graphics);

    assets.pattern_cell = {center_cell_off, center_cell_on, neighbor_cell_off, neighbor_cell_on};
  }
  private refreshRangeButtons() {
    const {range_button, range_decal} = palette.user_menu;
    const size = 100; // debug
    
    const {assets, graphics, renderer} = this;
    
    graphics.clear().beginFill(range_button).drawRect(0,0,size,size).endFill();
    const range_button_bg = renderer.generateTexture(graphics);

    graphics.clear().beginFill(range_decal).drawCircle(0,0,size*0.9).endFill(); // TODO:Replace with actual design
    const range_button_up_decal = renderer.generateTexture(graphics);

    graphics.clear().beginFill(range_decal).drawCircle(0,0,size*0.3).endFill(); // TODO:Replace with actual design
    const range_button_down_decal = renderer.generateTexture(graphics);

    assets.range_buttons = {range_button_bg, range_button_down_decal, range_button_up_decal};
  }
  private refreshTextInput() {
    const {text_background, text_border_active, text_border_inactive} = palette.user_menu;
    const border = 10; // debug -- border size
    const [width,height] = [300,70]; // debug
    
    const {assets, graphics, renderer} = this;

    graphics.clear()
      .beginFill(text_border_inactive).drawRect(0,0,width,height).endFill()
      .beginFill(text_background).drawRect(border,border,width-border,height-border).endFill();
    const text_input_inactive = renderer.generateTexture(graphics);
    graphics.clear()
      .beginFill(text_border_active).drawRect(0,0,width,height).endFill()
      .beginFill(text_background).drawRect(border,border,width-border,height-border).endFill();
    const text_input_active = renderer.generateTexture(graphics);

    assets.text_input = {text_input_active, text_input_inactive};
  }
  private refreshSlider() {
    const {slider_fill, slider_empty} = palette.user_menu;
    const slider_thumb_color = palette.user_menu.slider_thumb; // Whoops, conflicting naming paradigm
    
    const {assets, graphics, renderer} = this;

    graphics.clear().beginFill(slider_empty).drawRect(0,0,10,100).endFill();
    const slider_bg = renderer.generateTexture(graphics);
    graphics.clear().beginFill(slider_fill).drawRect(0,0,10,100).endFill();
    const slider_fg = renderer.generateTexture(graphics);
    graphics.clear().beginFill(slider_thumb_color).drawRect(0,0,10,100).endFill();
    const slider_thumb = renderer.generateTexture(graphics);
    
    assets.timer_slider = {slider_bg, slider_fg, slider_thumb};
  }
  private refreshStepButton() {
    const {step_button_active, step_button_inactive} = palette.user_menu;
    const [width,height] = [200,100]; // debug

    const {assets, graphics, renderer} = this;
    // TODO write label text onto texture
    graphics.clear().beginFill(step_button_inactive).drawRect(0,0,width,height).endFill();
    const step_button_default = renderer.generateTexture(graphics);
    graphics.clear().beginFill(step_button_active).drawRect(0,0,width,height).endFill();
    const step_button_pressed = renderer.generateTexture(graphics);

    assets.step_button = {step_button_default, step_button_pressed};
  }
  private refreshAutoButton() {
    const {auto_button_active, auto_button_inactive} = palette.user_menu;
    const [width,height] = [200,100]; // debug
    
    const {assets, graphics, renderer} = this;
    //TODO write label text onto texture
    graphics.clear().beginFill(auto_button_active).drawRect(0,0,width,height).endFill();
    const auto_button_on = renderer.generateTexture(graphics);
    graphics.clear().beginFill(auto_button_inactive).drawRect(0,0,width,height).endFill();
    const auto_button_off = renderer.generateTexture(graphics);

    assets.auto_button = {auto_button_off, auto_button_on};
  }
}
