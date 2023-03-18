import { Container, Rectangle, Renderer, Sprite, utils } from "pixi.js";
import { Layout, LayoutStyles } from "@pixi/layout";
import { CheckBox, FancyButton, Input, Slider } from "@pixi/ui";
import { AutomataOptions } from "../utils/CellContracts";
import { Cell } from "../utils/CellData";
import AssetManager from "./CellAssets";
import { NeighborhoodController } from "./UIComponents";
import UIComponentStyles from "./UIComponentStyles";

const hex2string = utils.hex2string;
const string2hex = utils.string2hex;

export class CellUI extends Container {
  // private config: Pick<AutomataOptions, "pattern"|"persists_at"|"populates_at">;

  private layout: Layout;

  constructor(
    asset_manager: AssetManager,
    // initial_rules: AutomataOptions,
    // renderer: Renderer,
    // onSearchPatternChange: (pattern: Cell[]) => void,
    // onPersistAtChange: (persist_at: number[]) => void,
    // onPopulateAtChange: (populate_at: number[]) => void,
    // requestNext: () => void,
    // requestLast: () => void,
    // requestReset: () => void,
    // rebuildRules: () => AutomataOptions
  ) {

    super();
    let neighborhood_controller = new NeighborhoodController(asset_manager);
    this.layout= new Layout({
      id: 'root',
      content: {
        user_menu: {
          content: {
            upper_user_menu: {
              content: {
                neighborhood_controller: {
                  content: {
                    pattern_block: {
                      content: {
                        pattern_container: {
                          content: {
                            pattern_controller: {
                              content: neighborhood_controller.getContent('pattern_controller')
                            }
                          }
                        }
                      }
                    },
                    range_block: {
                      content: {
                        range_buttons: {
                          content: {
                            range_up: {
                              content: neighborhood_controller.getContent('range_up')
                            },
                            range_down: {
                              content: neighborhood_controller.getContent('range_down')
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            middle_user_menu: {
              content: 'me'
            },
            lower_user_menu: {
              content: 'sideways'
            }
          }
        }
      },
      globalStyles: {
        mid_square: {
          background: 'tomato',
          position: 'center',
          maxWidth: 80,
          maxHeight: 80,
          overflow: 'hidden',
        },
        root: {
          width: '100%',
          height: '100%',
        },
        user_menu: {
          background: 'purple',
          display: 'block',
          height: '100%',
          position: 'rightCenter',
          width: '35%',
        },
        upper_user_menu: {
          background: 'olive',
          display: 'block',
          height: '50%',
          width: '100%',
        },
        middle_user_menu: {
          background: 'teal',
          width: '100%',
          height: '25%',
        },
        lower_user_menu: {
          background: 'white',
          width: '100%',
          height: '25%',
        },
        neighborhood_controller: {
          background: 'magenta',
          display: 'block',
          height: '100%',
          width: '100%',
        },
        pattern_block: {
          background: 'mistyrose', // debug
          display: 'block',
          height: '90%',
          position: 'leftCenter',
          width: '80%'
        },
        pattern_container: {
          background: 'cyan',
          borderRadius: 20,
          display: 'block',
          height: '90%',
          position: 'center',
          width: '90%'
        },
        pattern_controller: {
          // display: 'block',
          background: 'green',
          borderRadius: 20,
          maxHeight: '90%',
          maxWidth: '90%',
          overflow: 'hidden',
          position: 'center',
        },
        range_block: {
          background: 'midnightblue',
          display: 'block',
          height: '90%',
          // maxHeight: '20%',
          maxWidth: '20%',
          position: 'rightCenter',
          width: '20%'
        },
        range_buttons: {
          display: 'block',
          background: 'tomato',
          height: '90%',
          position: 'leftCenter',
          width: '80%',
        },
        range_up: {
          background: 'blue',
          // position: 'top',
          maxWidth: '95%',
        },
        range_down: {
          background: 'red',
          position: 'bottom',
          maxWidth: '95%',
        }
      }
    });
    // console.log(UIComponentStyles); this.x = this.y = 200
    this.addChild(this.layout)
    this.on('added',() => {
      this.resize(this.parent.width, this.parent.height)
    });
    console.log(this.layout);
    const pattern_controller_layout = this.layout.content.getByID('pattern_controller') as Layout;
    neighborhood_controller.onBuildDisplay(() => {
      if (! pattern_controller_layout ) return;
      const parent = pattern_controller_layout.parent;
      pattern_controller_layout.resize(parent.width, parent.height);
    });
    // neighborhood_controller.setRoot(5);
  }

  resize(width:number, height:number) {
    this.layout.resize(width, height);
  }
}