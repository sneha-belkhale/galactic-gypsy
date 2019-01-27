import CameraController from './CameraController';
import WorldGrid from './WorldGrid';
import HeroShader from './HeroShader'
var THREE = require('three');
var OrbitControls = require('three-orbit-controls')(THREE);
var FBXLoader = require('three-fbx-loader');
var OBJLoader = require('three-obj-loader')(THREE);


var scene, camera, controls, renderer;

var heroMesh;

var worldGrid, incomingPos;

var itemDictionary;
var audioArray;

var winSprite;


var loader = new FBXLoader();
var texLoader = new THREE.TextureLoader();
var objLoader = new THREE.OBJLoader();

const WORLD_WIDTH = 475;
const WORLD_HEIGHT = 475;
const WORLD_PADDING = 200;
const HERO_SPEED = 2;
export default function init() {
  /** BASIC THREE SETUP **/
  scene = new THREE.Scene();
  //set up camera
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 100000 );
  camera.position.set(WORLD_WIDTH/2,WORLD_HEIGHT/2,80)
  scene.add( camera );
  //set up controls
  controls = new CameraController(camera);

  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.antialias = true
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );
  window.addEventListener('keydown', moveSprite)

  worldGrid = new WorldGrid(WORLD_WIDTH, WORLD_HEIGHT);
  incomingPos = new THREE.Vector2(0,0);
  itemDictionary = {}

  var light = new THREE.DirectionalLight( 0xffffff, 5 );
  light.position.set( 0, 0, 0 );
  scene.add(light)

  var targetObject = new THREE.Mesh(new THREE.SphereGeometry(50), new THREE.MeshBasicMaterial());
  targetObject.position.set(500,500,-150)
  scene.add(targetObject);
  light.target = targetObject;

  var light2 = new THREE.DirectionalLight( 0xc0e7ff, 1 );
  light2.position.set( 0, 0, 0 );
  scene.add(light2)

  var targetObject2 = new THREE.Mesh(new THREE.SphereGeometry(50), new THREE.MeshBasicMaterial());
  targetObject2.position.set(-500,-500,-400)
  scene.add(targetObject2);
  light2.target = targetObject2;

  /** SCENE SETUP **/
  //add main scene plane

  loader.load(require('./assets/gg-ground-5.fbx'), function (object3d) {
    scene.add(object3d);
    var terrainMesh = object3d.children[0];
    terrainMesh.geometry.computeVertexNormals()
    terrainMesh.material = new THREE.MeshPhongMaterial({
      vertexColors: THREE.VertexColors,
      shading: THREE.FlatShading
    })
    terrainMesh.scale.set(6,6,6)
    terrainMesh.position.set(WORLD_WIDTH/2, WORLD_HEIGHT/2, -4)
    terrainMesh.rotateX(Math.PI/2)
    terrainMesh.updateMatrixWorld()

    //remove loading screen
    var homeScreen = document.getElementById('homeScreen');
    homeScreen.style.display = "none";

  });

  objLoader.load(require('./assets/gg-groundCollisions-5.obj'), function (object3d) {
    var crystalIdFound = 0;
    object3d.children.forEach((mesh)=>{
      var itemId = 4;
      mesh.geometry.computeBoundingBox()
      if(mesh.name.startsWith("cristal")){
        itemId = crystalIdFound+5;
        itemDictionary[itemId] = {
          type: 'audio',
          audioIdx: crystalIdFound,
          collected: false,
        }
        crystalIdFound ++;
      }
      mesh.scale.set(6,1,6)
      mesh.position.set(WORLD_WIDTH/2, WORLD_HEIGHT/2, -2)
      fillWorldGridForMeshKiko(mesh, itemId)
      mesh.rotateX(Math.PI/2)
      mesh.updateMatrixWorld()
      // scene.add(mesh)
    })
  });

  // var groundPlaneGeo = new THREE.PlaneGeometry(WORLD_WIDTH + WORLD_PADDING, WORLD_HEIGHT+ WORLD_PADDING,10,10);
  // var groundPlane = new THREE.Mesh(groundPlaneGeo, new THREE.MeshPhongMaterial())
  // groundPlane.position.x = WORLD_WIDTH/2 ;
  // groundPlane.position.y = WORLD_HEIGHT/2;
  //
  // scene.add(groundPlane)

  var heroGeo = new THREE.PlaneGeometry(12,12,10,10);
  const mUniforms = ({
    texture: { type: 't', value: texLoader.load(require('./assets/heroSprite2.png')) },
    n_rows: { type: 'f', value: 3 },
    n_cols: { type: 'f', value: 4 },
    frameIndex: { type: 'f', value: 1 },
  });

  const heroMat = new THREE.ShaderMaterial({
    uniforms: mUniforms,
    vertexShader: HeroShader.vertexShader,
    fragmentShader: HeroShader.fragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
  });

  heroMesh = new THREE.Mesh(heroGeo, heroMat)
  heroMesh.position.x = WORLD_WIDTH/2;
  heroMesh.position.y = WORLD_HEIGHT/2;
  heroMesh.material.uniforms.texture.value.needsUpdate = true;

  scene.add(heroMesh)


  const winUniforms = ({
    texture: { type: 't', value: texLoader.load(require('./assets/winSprite.png')) },
    n_rows: { type: 'f', value: 4 },
    n_cols: { type: 'f', value: 6 },
    frameIndex: { type: 'f', value: 1 },
  });

  const winMat = new THREE.ShaderMaterial({
    uniforms: winUniforms,
    vertexShader: HeroShader.vertexShader,
    fragmentShader: HeroShader.fragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
  });
  winSprite = new THREE.Mesh(new THREE.PlaneGeometry(7,7), winMat);
  winSprite.position.set(0,0,-100)
  scene.add(winSprite)

  winSprite.material.uniforms.texture.value.needsUpdate = true;



  var starbucksGeo = new THREE.PlaneGeometry(24,24,10,10);
  var itemId = 1;
  var starbucksMesh =  new THREE.Mesh(starbucksGeo, new THREE.MeshBasicMaterial({
    map: texLoader.load(require('./assets/starbucks.png')),
    transparent: true
  }))
  starbucksMesh.position.set(130,70,0)
  starbucksMesh.geometry.computeBoundingBox();
  itemDictionary[itemId] = {
    type: 'text',
    message: `Welcome to ST★RBUCKS!
    Here’s a list of our free services to compensate for our overpriced coffee:
    Hot water. Cold water.
    Restroom for all your resting purposes
    Comfy sofa chair (Limited seats. Slouch in yours NOW!)
    Access to the interwebz
    `
  }
  scene.add(starbucksMesh)
  //add to our grid
  fillWorldGridForMesh(starbucksMesh, itemId);

  var bedGeo = new THREE.PlaneGeometry(20,20,10,10);
  var itemId = 2;
  var bedMesh =  new THREE.Mesh(bedGeo, new THREE.MeshBasicMaterial({
    map: texLoader.load(require('./assets/bed.png')),
    transparent: true
  }))
  bedMesh.position.set(450,200,0)
  bedMesh.geometry.computeBoundingBox();
  itemDictionary[itemId] = {
    type: 'text',
    message: "The only place that embraces you no matter who you are."
  }
  scene.add(bedMesh)
  //add to our grid
  fillWorldGridForMesh(bedMesh, itemId);

  var wifiGeo = new THREE.PlaneGeometry(20,20,10,10);
  var itemId = 3;
  var wifiMesh =  new THREE.Mesh(wifiGeo, new THREE.MeshBasicMaterial({
    map: texLoader.load(require('./assets/wifi.png')),
    transparent: true
  }))
  wifiMesh.position.set(100,400,0)
  wifiMesh.geometry.computeBoundingBox();
  itemDictionary[itemId] = {
    type: 'text',
    message: `CONGRATULATIONS!!!
    YOU JUST WON A LIFETIME’S WORTH OF FREE WIFI
    CLICK [HERE] TO SIGN UP
    NO LIFE NEEDED. JUST YOUR CREDIT CARD.
    `
  }
  scene.add(wifiMesh)
  //add to our grid
  fillWorldGridForMesh(wifiMesh, itemId);

  var itemId = 44
  var lostAndFoundGeo = new THREE.PlaneGeometry(20,20,10,10);
  var lostAndFoundMesh =  new THREE.Mesh(lostAndFoundGeo, new THREE.MeshBasicMaterial({
    map: texLoader.load(require('./assets/lostAndFound.png')),
    transparent: true
  }))
  lostAndFoundMesh.position.set(450,450,0)
  lostAndFoundMesh.geometry.computeBoundingBox();
  itemDictionary[itemId] = {
    type: 'text',
    message: `You discovered your Home Directory! All of your files are nicely organized and you know where everything is.
    You navigate through folders with breeze getting a great amount of satisfaction.
    `
  }
  scene.add(lostAndFoundMesh)
  //add to our grid
  fillWorldGridForMesh(lostAndFoundMesh, itemId);

  // var boxGeo2 = new THREE.BoxGeometry(40,40,20);
  // var itemId = 4;
  // var boxMesh2 =  new THREE.Mesh(boxGeo2, new THREE.MeshBasicMaterial({color: new THREE.Color('#00ff0f')}))
  // boxMesh2.position.set(60,60,0)
  // boxMesh2.geometry.computeBoundingBox();
  // itemDictionary[itemId] = {
  //   type: 'audio',
  //   audioIdx: 0
  // }
  // scene.add(boxMesh2)
  // //add to our grid
  // fillWorldGridForMesh(boxMesh2, itemId);

  update();



  /** AUDIO setup **/
  var audioFiles = [
    require("./assets/testTracks/A.ogg"),
    require("./assets/testTracks/B.ogg"),
    require("./assets/testTracks/C.ogg"),
    require("./assets/testTracks/D.ogg"),
    require("./assets/testTracks/E.ogg"),
    require("./assets/testTracks/F.ogg"),
    require("./assets/testTracks/G.ogg"),
  ]
  audioArray = [];

  audioFiles.forEach((fileName)=>{
    var audio = new Audio(fileName);
    audio.loop = true;
    audio.volume = 1;
    audioArray.push(audio)
  })

  /** HTML setup **/
  var span = document.getElementsByClassName("close")[0];
  var modal = document.getElementById('modalDialogue');
  span.onclick = function() {
    modal.style.display = "none";
  }
}

function fillWorldGridForMesh(mesh, itemId){
  var bbox = mesh.geometry.boundingBox;
  for (var i = bbox.min.y + mesh.position.y; i < bbox.max.y + mesh.position.y; i++){
    for (var j=bbox.min.x + mesh.position.x; j<bbox.max.x + mesh.position.x; j++){
      worldGrid.setValueAtWorldPos(j,i, itemId);
    }
  }
}

function fillWorldGridForMeshKiko(mesh, itemId){
  var bbox = mesh.geometry.boundingBox;
  // console.log(bbox)
  var position = mesh.geometry.boundingBox.min.clone().add(mesh.geometry.boundingBox.max).multiplyScalar(6*0.5)
  var xPos = position.x+ WORLD_WIDTH/2;
  var yPos = -position.z+ WORLD_HEIGHT/2;

  var xLength = 3*(bbox.max.x - bbox.min.x);
  var yLength = 3*(bbox.max.z - bbox.min.z);

  for (var i = -yLength + yPos; i < yLength + yPos; i++){
    for (var j=-xLength + xPos; j<xLength + xPos; j++){
      worldGrid.setValueAtWorldPos(j,i, itemId);
    }
  }
}

var moveIdx = 0;
function moveSprite(event) {
  var incomingSriteIndex;
  moveIdx ++;
  if(moveIdx > 2 ){
    moveIdx = 0;
  }

  switch(event.keyCode){
    case 37:
      incomingPos.set(heroMesh.position.x - HERO_SPEED, heroMesh.position.y)
      incomingSriteIndex = moveIdx*4 + 2;
    break;
    case 38:
      incomingPos.set(heroMesh.position.x, heroMesh.position.y + HERO_SPEED)
      incomingSriteIndex = moveIdx*4 + 3;
    break;
    case 39:
      incomingPos.set(heroMesh.position.x + HERO_SPEED, heroMesh.position.y)
      incomingSriteIndex = moveIdx*4 + 1;
    break;
    case 40:
      incomingPos.set(heroMesh.position.x, heroMesh.position.y - HERO_SPEED)
      incomingSriteIndex = moveIdx*4 + 0;
    break;
  }

  heroMesh.material.uniforms.frameIndex.value = incomingSriteIndex;
  var passed = handleSpriteWorldCollisions(incomingPos.x, incomingPos.y);
  if (passed){
    heroMesh.position.x = incomingPos.x;
    heroMesh.position.y = incomingPos.y;
  }
}

function handleSpriteWorldCollisions(posX, posY){
  var worldItem = worldGrid.valueAtWorldPos(posX, posY);

  //check if within bounds
  if(posX > WORLD_WIDTH || posX < 0 ||posY > WORLD_HEIGHT|| posY < 0){
    return false;
  }
  if(worldItem !== 0 && worldItem !== undefined){
    // Get the modal
    console.log(itemDictionary)
    handleActionOnCollide(worldItem);
    return false
  }
  return true;
}

var audiosLoaded = false;
function handleActionOnCollide(worldItemIdx){
  //dictionary for popups
  var item = itemDictionary[worldItemIdx];
  if(!item){
    return
  }
  switch (item.type){
    case 'text':
      var modal = document.getElementById('modalDialogue');
      modal.style.display = "block";
      var modalText = document.getElementById('modalText');
      modalText.innerHTML = item.message;
    break;
    case 'audio':
      if(!audiosLoaded){
        audioArray.forEach((audio) => {
          audio.play()
          audio.volume = 0.1
        })
        audiosLoaded = true;
      }
      if(audioArray[item.audioIdx].collected){
        return;
      }
      winSprite.position.copy(heroMesh.position)
      setTimeout(function(){
        winSprite.position.z = -100;
      }, 3000);
      audioArray[item.audioIdx].volume = 1.0;
      audioArray[item.audioIdx].collected = true;
    break;
  }

}

var lastTime = Date.now()

function update() {
  controls.update()
  renderer.render(scene, camera);
  requestAnimationFrame(update);
  winSprite.position.x = heroMesh.position.x;
  winSprite.position.y = heroMesh.position.y;
  var time = Date.now();
  if(time - lastTime > 100){
    controls.setTargetPos(heroMesh.position.x, heroMesh.position.y)
    lastTime = Date.now()
    winSprite.material.uniforms.frameIndex.value += 1;
    if (winSprite.material.uniforms.frameIndex.value > 23){
      winSprite.material.uniforms.frameIndex.value = 0;
    }
  }

}
