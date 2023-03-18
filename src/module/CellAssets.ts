import { Graphics, IRenderer, RenderTexture } from "pixi.js";
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
interface AssetMap {
  pattern_cell: PatternCell;
  range_buttons: RangeButtons;
  text_input: TextInput;
  timer_slider: TimerSlider;
  step_button: StepButton;
  auto_button: AutoButton;
};

export default class AssetManager {

  private renderer: IRenderer;
  private graphics: Graphics;
  
  /**
   * All rendered assets this app needs
  */
 private assets: AssetMap;
 private loaded = false;

  /**
   * Instantiated with a rendering context.
   */
  constructor(renderer: IRenderer) {
    this.renderer = renderer;
    this.graphics = new Graphics();
    
    this.assets = {
      pattern_cell: this.newCellTextures(),
      range_buttons: this.newRangeButtonTextures(),
      text_input: this.newTextInputTextures(),
      timer_slider: this.newTimerSliderTextures(),
      step_button: this.newStepTextures(),
      auto_button: this.newAutoTextures()
    };

  }

  /**
   * @returns if this class is still drawing
   */
  public isLoaded():boolean {
    return this.loaded;
  }
  
  /**
   * Getter
   */
  public get<K extends keyof AssetMap>(asset_type: K):AssetMap[K] {
    return this.assets[asset_type];
  }

  /**
   * Request redraw of component textures
   * If target is null, redraws all 
   * @param targets 
   */
  public refresh(target?:keyof AssetMap) {
    this.loaded = false;

    const all = !target;

    if ( all || target === 'pattern_cell' ) this.assets.pattern_cell = this.newCellTextures();
    if ( all || target === 'range_buttons' ) this.assets.range_buttons = this.newRangeButtonTextures();
    if ( all || target === 'text_input' ) this.assets.text_input = this.newTextInputTextures();
    if ( all || target === 'timer_slider' ) this.assets.timer_slider = this.newTimerSliderTextures();
    if ( all || target === 'step_button' ) this.assets.step_button = this.newStepTextures();
    if ( all || target === 'auto_button' ) this.assets.auto_button = this.newAutoTextures();

    this.loaded = true;
  }

  /**
   * Private
   */
  private newCellTextures() {
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

    return {center_cell_off, center_cell_on, neighbor_cell_off, neighbor_cell_on};
  }
  private newRangeButtonTextures() {
    const {range_button, range_decal} = palette.user_menu;
    const size = 100; // debug
    
    const {graphics, renderer} = this;
    
    graphics.clear().beginFill(range_button).drawRoundedRect(0,0,size,size, 20).endFill();
    const range_button_bg = renderer.generateTexture(graphics);

    graphics.clear().beginFill(range_decal).drawCircle(0,0,size/2*0.7).endFill(); // TODO:Replace with actual design
    const range_button_up_decal = renderer.generateTexture(graphics);

    graphics.clear().beginFill(range_decal).drawCircle(0,0,size/2*0.3).endFill(); // TODO:Replace with actual design
    const range_button_down_decal = renderer.generateTexture(graphics);

    return {range_button_bg, range_button_down_decal, range_button_up_decal};
  }
  private newTextInputTextures() {
    const {text_background, text_border_active, text_border_inactive} = palette.user_menu;
    const border = 10; // debug -- border size
    const [width,height] = [300,70]; // debug
    
    const {graphics, renderer} = this;

    graphics.clear()
      .beginFill(text_border_inactive).drawRect(0,0,width,height).endFill()
      .beginFill(text_background).drawRect(border,border,width-border,height-border).endFill();
    const text_input_inactive = renderer.generateTexture(graphics);
    graphics.clear()
      .beginFill(text_border_active).drawRect(0,0,width,height).endFill()
      .beginFill(text_background).drawRect(border,border,width-border,height-border).endFill();
    const text_input_active = renderer.generateTexture(graphics);

    return {text_input_active, text_input_inactive};
  }
  private newTimerSliderTextures() {
    const {slider_fill, slider_empty} = palette.user_menu;
    const slider_thumb_color = palette.user_menu.slider_thumb; // Whoops, conflicting naming paradigm
    
    const {graphics, renderer} = this;

    graphics.clear().beginFill(slider_empty).drawRect(0,0,10,100).endFill();
    const slider_bg = renderer.generateTexture(graphics);
    graphics.clear().beginFill(slider_fill).drawRect(0,0,10,100).endFill();
    const slider_fg = renderer.generateTexture(graphics);
    graphics.clear().beginFill(slider_thumb_color).drawRect(0,0,10,100).endFill();
    const slider_thumb = renderer.generateTexture(graphics);
    
    return {slider_bg, slider_fg, slider_thumb};
  }
  private newStepTextures() {
    const {step_button_active, step_button_inactive} = palette.user_menu;
    const [width,height] = [200,100]; // debug

    const {graphics, renderer} = this;
    // TODO write label text onto texture
    graphics.clear().beginFill(step_button_inactive).drawRect(0,0,width,height).endFill();
    const step_button_default = renderer.generateTexture(graphics);
    graphics.clear().beginFill(step_button_active).drawRect(0,0,width,height).endFill();
    const step_button_pressed = renderer.generateTexture(graphics);

    return {step_button_default, step_button_pressed};
  }
  private newAutoTextures() {
    const {auto_button_active, auto_button_inactive} = palette.user_menu;
    const [width,height] = [200,100]; // debug
    
    const {graphics, renderer} = this;
    //TODO write label text onto texture
    graphics.clear().beginFill(auto_button_active).drawRect(0,0,width,height).endFill();
    const auto_button_on = renderer.generateTexture(graphics);
    graphics.clear().beginFill(auto_button_inactive).drawRect(0,0,width,height).endFill();
    const auto_button_off = renderer.generateTexture(graphics);

    return {auto_button_off, auto_button_on};
  }
}
