// import { Application,Assets,Container,Graphics, Sprite } from 'pixi.js'

// const app = new Application({
// 	view: document.querySelector("canvas") as HTMLCanvasElement,
// 	resolution: window.devicePixelRatio || 1,
// 	autoDensity: true,
// 	backgroundColor: 0x6495ed,
// 	width: 640,
// 	height: 480
// });

// const conty: Container = new Container();
// app.stage.addChild(conty);
// const promise = Assets.load("clampy.png");
// let clampy: Sprite;

// console.log('spinning')

// conty.x = app.screen.width/2;
// conty.y = app.screen.height/2;
// promise.then((tex) => {
// 	clampy = new Sprite(tex);
// 	conty.addChild(clampy);
// 	conty.width /= 2;
// 	conty.height /= 2;
// 	let ox = conty.x,
// 	oy = conty.y;
	
// 	let adj = (-conty.width)/2;
// 	let opp = (conty.height)/2;
// 	let r = Math.sqrt(adj**2 + opp**2);
// 	const r2d = 180/Math.PI;
// 	const d2r = Math.PI/180;
	
// 	let deg = 180 + Math.atan(opp/adj) * r2d;
// 	let canter = deg;

// 	app.ticker.add(() => {
// 		deg = conty.angle - canter;
// 		conty.x = r*Math.cos(deg*d2r) + ox;
// 		conty.y = r*Math.sin(deg*d2r) + oy;
// 		conty.angle++;
// 	})
// });


// const g = new Graphics();
// g.lineStyle({width: 1, color: 0xffffff, alpha: 1})
// g.moveTo(100,100); g.lineTo(200, 100);

// g.lineStyle({width: 1, color: 0x888888, alpha: 1})
// g.moveTo(100, 105); g.lineTo(200, 105);

// const s = Sprite.from(app.renderer.generateTexture(g));
// g.destroy();
// s.x = s.y = 100;
// conty.addChild(s);

import { CellView } from "./CellView";

const container = document.querySelector('#pixi-content') as HTMLElement;
container.addEventListener('contextmenu', (e) => e.preventDefault());
const cv = new CellView(container, () => {})
cv.build(false);