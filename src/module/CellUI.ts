import { Container, IRenderer, Rectangle, Renderer, Sprite, utils } from "pixi.js";
import { Layout, LayoutStyles } from "@pixi/layout";
import { CheckBox, FancyButton, Input, Slider } from "@pixi/ui";
import { AutomataOptions } from "../utils/CellContracts";
import { Cell } from "../utils/CellData";
import AssetManager from "./CellAssets";
import { NeighborhoodController, RuleController, UpdateController } from "./UIComponents";
import UIComponentStyles from "./UIComponentStyles";
import { CellGrid } from "./CellGrid";

const hex2string = utils.hex2string;
const string2hex = utils.string2hex;

export class CellUI extends Container {
  // private config: Pick<AutomataOptions, "pattern"|"persists_at"|"populates_at">;
  private asset_man: AssetManager;

  private layout: Layout;

  constructor(
    renderer: IRenderer
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

    const asset_man = this.asset_man = new AssetManager(renderer);
    // Child components
    // const grid = new CellGrid(renderer, () => {});
    const neighborhood_controller = new NeighborhoodController(asset_man);
    const persist_input = new RuleController(asset_man);
    const populate_input = new RuleController(asset_man);
    const update_controller = new UpdateController(asset_man);

    this.layout = new Layout(
      this.formattedLayoutOptions(
        // grid,
        neighborhood_controller,
        persist_input,
        populate_input,
        update_controller
      )
    );
    this.addChild(this.layout);
    this.on('added',() => {
      this.resize(this.parent.width, this.parent.height)
    });

    // Until the Layout class has a bubbling refresh and/or content Containers emit a resize event--
    // a content Container cannot be dynamically sized without invoking the resize method of its parent.
    const pattern_controller_layout = this.layout.content.getByID('pattern_controller') as Layout;
    neighborhood_controller.onBuildDisplay(() => {
      const parent = pattern_controller_layout?.parent;
      if (! parent ) return; // Missing parent
      pattern_controller_layout.resize(parent.width, parent.height);
    });
  }

  resize(width:number, height:number) {
    this.layout.resize(width, height);
  }

  private formattedLayoutOptions(
    // grid: CellGrid,
    neighborhood_controller: NeighborhoodController,
    persist_at: RuleController,
    populate_at: RuleController,
    update_controller: UpdateController
  ) {
    return { 
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
              content: {
                rule_block: {
                  content: {
                    persist_rule_container: {
                      content: {
                        label_container: {
                          content: {
                            label: {
                              content: 'Persist_at: '
                            }
                          }
                        },
                        input_container: {
                          content: {
                            input: {
                              content: persist_at.getContent()
                            }
                          }
                        }
                      }
                    },
                    populate_rule_container: {
                      content: {
                        label_container: {
                          content: {
                            label: {
                              content: 'Populate_at: '
                            }
                          }
                        },
                        input_container: {
                          content: {
                            input: {
                              content: populate_at.getContent()
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            lower_user_menu: {
              content: {
                update_block: {
                  content: {
                    direction_controller: {
                      content: {
                        step_block: {
                          content: update_controller.getContent('step_button')
                        },
                        auto_block: {
                          content: update_controller.getContent('auto_button')
                        }
                      }
                    },
                    timing_block: {
                      content: {
                        timing_container: {
                          content: update_controller.getContent('timer_slider')
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      globalStyles: UIComponentStyles
    }
  }
}
