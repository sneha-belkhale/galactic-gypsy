export default class CameraController {
  constructor(camera){
    this.camera = camera;
    this.targetPosition = camera.position.clone();
  }
  update(){
    var dir = this.targetPosition.clone().sub(this.camera.position).multiplyScalar(0.05);
    this.camera.position.add(dir);
  }
  setTargetPos(x,y) {
    this.targetPosition.x = x;
    this.targetPosition.y = y;
  }
}
