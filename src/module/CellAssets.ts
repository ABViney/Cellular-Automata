import { Assets, Graphics } from "pixi.js";
import palette from "../CellColorPallette";

/**
 * All pre-rendered assets this app needs
 */
export const assets = {
  center_cell_off: new Graphics(),
  center_cell_on: new Graphics(),
  neighbor_cell_off: new Graphics(),
  neighbor_cell_on: new Graphics(),
  range_button_bg: new Graphics(),
  range_button_up_decal: new Graphics(),
  range_button_down_decal: new Graphics(),

  text_input_inactive: new Graphics(),
  text_input_active: new Graphics(),

  slider_bg: new Graphics(),
  slider_fg: new Graphics(),
  slider_thumb: new Graphics(),

  step_button_default: new Graphics(),
  step_button_pressed: new Graphics(),
  auto_button_off: new Graphics(),
  auto_button_on: new Graphics()
};

/**
 * Redraw functions are aggregated preceeding export
 */
function refreshCenterCell() {
  const on_color = palette.grid.cell;
  const off_color = palette.user_menu.center_cell_off;
  const size = 100; // debug
  assets.center_cell_on.clear().beginFill(on_color).drawRect(0,0,size,size).endFill();
  assets.center_cell_off.clear().beginFill(off_color).drawRect(0,0,size,size).endFill();
}
function refreshNeighborCell() {
  const on_color = palette.grid.cell;
  const off_color = palette.user_menu.neighbor_cell_off;
  const size = 100; // debug
  assets.neighbor_cell_on.clear().beginFill(on_color).drawRect(0,0,size,size).endFill();
  assets.neighbor_cell_off.clear().beginFill(off_color).drawRect(0,0,size,size).endFill();
}
function refreshRangeButtons() {
  const {range_button, range_decal} = palette.user_menu;
  const size = 100; // debug
  assets.range_button_bg.clear().beginFill(range_button).drawRect(0,0,size,size).endFill();
  assets.range_button_up_decal.clear().beginFill(range_decal).drawCircle(0,0,size*0.9).endFill(); // Replace with actual design
  assets.range_button_down_decal.clear().beginFill(range_decal).drawCircle(0,0,size*0.3).endFill(); // Replace with actual design
}
function refreshTextInput() {
  const {text_background, text_border_active, text_border_inactive} = palette.user_menu;
  const bs = 10; // debug -- border size
  const [width,height] = [300,70]; // debug
  assets.text_input_inactive.clear().beginFill(text_border_inactive).drawRect(0,0,width,height).endFill()
        .beginFill(text_background).drawRect(bs,bs,width-bs,height-bs).endFill();
  assets.text_input_active.clear()
        .beginFill(text_border_active).drawRect(0,0,width,height).endFill()
        .beginFill(text_background).drawRect(bs,bs,width-bs,height-bs).endFill();
}
function refreshSlider() {
  const {slider_fill, slider_empty, slider_thumb} = palette.user_menu;
  assets.slider_bg.clear().beginFill(slider_empty).drawRect(0,0,10,100).endFill();
  assets.slider_fg.clear().beginFill(slider_fill).drawRect(0,0,10,100).endFill();
  assets.slider_thumb.clear().beginFill(slider_thumb).drawRect(0,0,10,100).endFill();
}
function refreshStepButton() {
  const {step_button_active, step_button_inactive} = palette.user_menu;
  // TODO move text write here
  const [width,height] = [200,100]; // debug
  assets.step_button_default.clear().beginFill(step_button_inactive).drawRect(0,0,width,height).endFill();
  assets.step_button_pressed.clear().beginFill(step_button_active).drawRect(0,0,width,height).endFill();
}
function refreshAutoButton() {
  const {auto_button_active, auto_button_inactive} = palette.user_menu;
  //TODO move text write here
  const [width,height] = [200,100]; // debug
  assets.auto_button_on.clear().beginFill(auto_button_active).drawRect(0,0,width,height).endFill();
  assets.auto_button_off.clear().beginFill(auto_button_inactive).drawRect(0,0,width,height).endFill();
}

/**
 * Type hinting to save me from myself
 */
type Asset = 'center_cell'|'neighbor_cell'|'range_button'|'text'|'slider'|'step'|'auto';
type AssetsDict = {
  [K in Asset]: () => void;
};

// Aggregate
const refreshFunctions:AssetsDict = {
  center_cell: refreshCenterCell,
  neighbor_cell: refreshNeighborCell,
  range_button: refreshRangeButtons,
  text: refreshTextInput,
  slider: refreshSlider,
  step: refreshStepButton,
  auto: refreshAutoButton
};

/**
 * Request redraw of component textures
 * If target is null, redraws all 
 * @param targets 
 */
export function refreshAssets(target?:Asset) {
  if (! target ) {
    for ( const asset of Object.keys(refreshFunctions) as Asset[]) {
      refreshFunctions[asset]();
    }
  } else {
    refreshFunctions[target]();
  }
}