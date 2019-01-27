export default class WorldGrid {
  constructor(width, height){
    this.grid = new Int8Array(width*height);
    this.width = width;
    this.height = height;
  }
  valueAtWorldPos(posX, posY){
    posX = Math.ceil(posX);
    posY = Math.ceil(posY);
    var idx = posY*this.width + posX;
    return this.grid[idx];
  }
  setValueAtWorldPos(posX, posY, itemId){
    posX = Math.ceil(posX);
    posY = Math.ceil(posY);
    var idx = posY*this.width + posX;
    this.grid[idx]=itemId;
  }
}
