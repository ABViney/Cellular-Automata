import { CellView } from "./CellView";
import { CellController } from "./CellController";

const parent = document.querySelector('#pixi-content') as HTMLElement;
const cc = new CellController(parent);