import { Container, Sprite } from "pixi.js";

export class Scene extends Container {
  private readonly screen_width: number;
  private readonly screen_height: number;
 
  private clampy: Sprite;
  constructor(screen_width: number, screen_height: number) {
    super();

    this.screen_width = screen_width;
    this.screen_height = screen_height;

    this.clampy = Sprite.from("clampy.png");
    this.clampy.anchor.set(0.5);
    this.clampy.x = this.screen_width/2;
    this.clampy.y = this.screen_height/2;
    this.addChild(this.clampy);
  }
}