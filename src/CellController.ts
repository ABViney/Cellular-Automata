import { CellModel } from "./CellModel";
import { CellView } from "./CellView";
import { Cell, CellMap } from "./CellData";
import { DataOperation, UserRequest, AutomataOptions, AutomataSystem } from "./CellContracts";

export class CellController implements UserRequest {

  /**
   * Listen for view to request something
   * Listen for changes in view
   * Provide view with data
   */
  private view: CellView;

  /**
   * Mediate requests to the system
   * build systems from data (encapsulate in own class)
   * Track most recent data from system
   */
  private system: DataOperation;

  /**
   * This system depicts Conway's Game of Life
   * The initial state describes the cells that make up a "Glider"
   */
  private default_system: AutomataSystem = {
    state: [
              [ 0,-1],          //   #
                      [ 1, 0],  //     #
      [-1, 1],[ 0, 1],[ 1, 1]   // # # #
    ],
    old_states: [] as Cell[][],
    search_pattern: [
      [-1,-1],[ 0,-1],[ 1,-1],
      [-1, 0],        [ 1, 0],
      [-1, 1],[ 0, 1],[ 1, 1]
    ],
    persists_at: [2,3],
    populates_at: [3],
    max_history: 25
  };

  /**
   * 
   * @param container 
   */
  public constructor(container: HTMLElement) {

    let starting_system: AutomataSystem;
    starting_system = this.default_system; // Change to conditional assignment
    const system = this.system = new CellModel(starting_system);
    // Ensure valid build of system, fallback to default if invalid

    // Build view. Point it to insert itself into the container
    // Pass it this as a UserRequest facillitator 
    const view = this.view = new CellView(
      container,
      this,
      starting_system.state
    );

  }

  /**
   * Post any changes and process the next state
   * @returns presentable data
   */
  next = (options?: AutomataOptions): Cell[] => {
    // Once the system finishes processing it will return the next state
    return this.system.update(options)
  }

  /**
   * Rollback to a prior state
   * @returns presentable data
   */
  prev = (): Cell[] => {
    return this.system.undo();
  }

  /**
   * Clear the current state
   * @returns an empty array
   */
  reset = (): Cell[] => {
    return this.system.clear();
  }
  
  //TODO: callback for cellview to pass cell Options
}