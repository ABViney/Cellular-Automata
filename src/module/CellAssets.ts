import { Assets, Graphics, Renderer, Texture } from "pixi.js";
import palette from "../CellColorPallette";

/**
 * Type hinting to save me from myself
 */
export type AssetGroup = 'center_cell'|'neighbor_cell'|'range_button'|'text'|'slider'|'step'|'auto';
export type AssetGroupDict = {
  [K in AssetGroup]: () => void;
};
export type AssetDict = {
  center_cell_off?: Texture;
  center_cell_on?: Texture;
  neighbor_cell_off?: Texture;
  neighbor_cell_on?: Texture;

  range_button_bg?: Texture;
  range_button_up_decal?: Texture;
  range_button_down_decal?: Texture;

  text_input_inactive?: Texture;
  text_input_active?: Texture;

  slider_bg?: Texture;
  slider_fg?: Texture;
  slider_thumb?: Texture;

  step_button_default?: Texture;
  step_button_pressed?: Texture;

  auto_button_off?: Texture;
  auto_button_on?: Texture;
};

export default class AssetManager {

  private renderer: Renderer;
  private graphics: Graphics;
  
  /**
   * All rendered assets this app needs
  */
 private assets: AssetDict = {};
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
  private refreshFunctions:AssetGroupDict = {
    center_cell: this.refreshCenterCell,
    neighbor_cell: this.refreshNeighborCell,
    range_button: this.refreshRangeButtons,
    text: this.refreshTextInput,
    slider: this.refreshSlider,
    step: this.refreshStepButton,
    auto: this.refreshAutoButton
  };
  
  /**
   * Request redraw of component textures
   * If target is null, redraws all 
   * @param targets 
   */
  private refresh(target?:AssetGroup) {
    this.loaded = false;
    if (! target ) {
      for ( const asset of Object.keys(this.refreshFunctions) as AssetGroup[] ) {
        this.refreshFunctions[asset]();
      }
    } else {
      this.refreshFunctions[target]();
    }
    this.loaded = true;
  }

  private refreshCenterCell() {
    const on_color = palette.grid.cell;
    const off_color = palette.user_menu.center_cell_off;
    const size = 100; // TODO: add an external reference to an object with sizing fields
    const g = this.graphics;
    g.clear().beginFill(on_color).drawRect(0,0,size,size).endFill();
    this.assets.center_cell_on = this.renderer.generateTexture(g);
    g.clear().beginFill(off_color).drawRect(0,0,size,size).endFill();
    this.assets.center_cell_off = this.renderer.generateTexture(g);
  }
  private refreshNeighborCell() {
    const on_color = palette.grid.cell;
    const off_color = palette.user_menu.neighbor_cell_off;
    const size = 100; // debug
    const g = this.graphics;
    this.assets.neighbor_cell_on = this.renderer.generateTexture(g);
    g.clear().beginFill(on_color).drawRect(0,0,size,size).endFill();
    this.assets.neighbor_cell_off = this.renderer.generateTexture(g);
    g.clear().beginFill(off_color).drawRect(0,0,size,size).endFill();
  }
  private refreshRangeButtons() {
    const {range_button, range_decal} = palette.user_menu;
    const size = 100; // debug
    const g = this.graphics;
    g.clear().beginFill(range_button).drawRect(0,0,size,size).endFill();
    this.assets.range_button_bg = this.renderer.generateTexture(g);
    g.clear().beginFill(range_decal).drawCircle(0,0,size*0.9).endFill(); // Replace with actual design
    this.assets.range_button_up_decal = this.renderer.generateTexture(g);
    g.clear().beginFill(range_decal).drawCircle(0,0,size*0.3).endFill(); // Replace with actual design
    this.assets.range_button_down_decal = this.renderer.generateTexture(g);
  }
  private refreshTextInput() {
    const {text_background, text_border_active, text_border_inactive} = palette.user_menu;
    const bs = 10; // debug -- border size
    const [width,height] = [300,70]; // debug
    const g = this.graphics;
    g.clear().beginFill(text_border_inactive).drawRect(0,0,width,height).endFill()
          .beginFill(text_background).drawRect(bs,bs,width-bs,height-bs).endFill();
    this.assets.text_input_inactive = this.renderer.generateTexture(g);
          g.clear()
                .beginFill(text_border_active).drawRect(0,0,width,height).endFill()
                .beginFill(text_background).drawRect(bs,bs,width-bs,height-bs).endFill();
    this.assets.text_input_active = this.renderer.generateTexture(g);
  }
  private refreshSlider() {
    const {slider_fill, slider_empty, slider_thumb} = palette.user_menu;
    const g = this.graphics;
    g.clear().beginFill(slider_empty).drawRect(0,0,10,100).endFill();
    this.assets.slider_bg = this.renderer.generateTexture(g);
    g.clear().beginFill(slider_fill).drawRect(0,0,10,100).endFill();
    this.assets.slider_fg = this.renderer.generateTexture(g);
    g.clear().beginFill(slider_thumb).drawRect(0,0,10,100).endFill();
    this.assets.slider_thumb = this.renderer.generateTexture(g);
  }
  private refreshStepButton() {
    const {step_button_active, step_button_inactive} = palette.user_menu;
    // TODO move text write here
    const [width,height] = [200,100]; // debug
    const g = this.graphics;
    g.clear().beginFill(step_button_inactive).drawRect(0,0,width,height).endFill();
    this.assets.step_button_default = this.renderer.generateTexture(g);
    g.clear().beginFill(step_button_active).drawRect(0,0,width,height).endFill();
    this.assets.step_button_pressed = this.renderer.generateTexture(g);
  }
  private refreshAutoButton() {
    const {auto_button_active, auto_button_inactive} = palette.user_menu;
    //TODO move text write here
    const [width,height] = [200,100]; // debug
    const g = this.graphics;
    g.clear().beginFill(auto_button_active).drawRect(0,0,width,height).endFill();
    this.assets.auto_button_on = this.renderer.generateTexture(g);
    g.clear().beginFill(auto_button_inactive).drawRect(0,0,width,height).endFill();
    this.assets.auto_button_off = this.renderer.generateTexture(g);
  }

}
