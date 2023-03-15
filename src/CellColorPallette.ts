const default_palette = {
  grid: {
    background: 0x222222,
    line_major: 0xffffff,
    line_minor: 0x888888,
    cell: 0xffff00
  },
  user_menu: {
    frame: 0x2f4858,
    neighborhood_controller: 0x1e1c0c,
    center_cell_off:0xffffff,
    neighbor_cell_off:0xaeac99,
    range_button: 0x007184,
    range_decal: 0xffffff,

    text_inactive: 0x659b91,
    text_active: 0xc3fcf1,
    text_background: 0x1e1c0c,
    text_border_inactive: 0x494738,
    text_border_active: 0x00fef9, 

    slider_fill: 0x00fffb,
    slider_empty: 0xaeac99,
    slider_thumb: 0x00f4ff,

    auto_button_inactive: 0xffc771,
    auto_button_active: 0xffe143,
    auto_button_text_inactive: 0x95b1af,
    auto_button_text_active: 0x00efff,

    step_button_inactive: 0xaeac99,
    step_button_active: 0xffe143,
    step_button_text_inactive: 0x95b1af,
    step_button_text_active: 0xfbfaf0
  }
};

const runtime_palette = JSON.parse(JSON.stringify(default_palette));
export default runtime_palette;