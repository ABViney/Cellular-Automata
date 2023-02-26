import { CellView } from "./CellView";


const container = document.querySelector('#pixi-content') as HTMLElement;
container.addEventListener('contextmenu', (e) => e.preventDefault());
const cv = new CellView(container, () => {})
cv.build(false);