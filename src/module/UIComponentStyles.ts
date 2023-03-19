import { LayoutStyles } from "@pixi/layout";
import palette from "../CellColorPallette";

const neighborhood_controller: LayoutStyles = {
  neighborhood_controller: {
    display: 'block',
    height: '100%',
    width: '100%',
  },
  pattern_block: {
    display: 'block',
    height: '90%',
    position: 'leftCenter',
    width: '80%'
  },
  pattern_container: {
    background: palette.user_menu.neighborhood_controller,
    borderRadius: 20,
    display: 'block',
    height: '90%',
    position: 'center',
    width: '90%'
  },
  pattern_controller: {
    borderRadius: 20,
    maxHeight: '90%',
    maxWidth: '90%',
    overflow: 'hidden',
    position: 'center',
  },
  range_block: {
    display: 'block',
    height: '90%',
    // maxHeight: '20%',
    maxWidth: '20%',
    position: 'rightCenter',
    width: '20%'
  },
  range_buttons: {
    display: 'block',
    height: '90%',
    position: 'leftCenter',
    width: '80%',
  },
  range_up: {
    // position: 'top',
    maxWidth: '95%',
  },
  range_down: {
    position: 'bottom',
    maxWidth: '95%',
  }
}

const rule_controller: LayoutStyles = {
  rule_block: {
    display: 'block',
    height: '90%',
    position: 'center',
    width: '95%'
  },
  persist_rule_container: {
    display: 'block',
    height: '50%',
    width: '100%'
  },
  populate_rule_container: {
    display: 'block',
    height: '50%',
    width: '100%'
  },
  label_container: {
    color: palette.user_menu.text_active,
    height: '100%',
    width: '25%'
  },
  label: {
    height: '100%',
    fontSize: 16,
    position: 'center'
  },
  input_container: {
    width: '75%'
  },
  input: {
    maxWidth: '100%',
    position: 'center'
  }
}

const timer_controller: LayoutStyles = {
  update_block: {
    height: '95%',
    position: 'center',
    width: '100%'
  },
  direction_controller: {
    height: '100%',
    width: '70%'
  },
  step_block: {
    maxHeight: '50%',
    maxWidth: '100%'
  },
  auto_block: {
    maxHeight: '50%',
    maxWidth: '100%'
  },
  timing_block: {
    display: 'block',
    height: '100%',
    width: '30%'
  },
  timing_container: {
    maxHeight: '100%',
    maxWidth: '100%',
    minHeight: '80%',
    position: 'center'
  }
}

const user_menu: LayoutStyles = {
  user_menu: {
    background: palette.user_menu.frame,
    display: 'block',
    height: '100%',
    position: 'rightCenter',
    width: '35%',
  },
  upper_user_menu: {
    display: 'block',
    height: '50%',
    width: '100%',
  },
  middle_user_menu: {
    display: 'block',
    width: '100%',
    height: '25%',
  },
  lower_user_menu: {
    display: 'block',
    width: '100%',
    height: '25%',
  },

  ...neighborhood_controller,
  ...rule_controller,
  ...timer_controller
}

export default {
  root: {
    width: '100%',
    height: '100%',
  },
  
  ...user_menu
}