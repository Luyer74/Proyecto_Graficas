import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Vector3 } from "three";

let starGeo, stars;

//controller class
class BasicCharacterControls {
  constructor(params) {
    this._Init(params);
  }

  _Init(params) {
    this._params = params;
    this._move = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    };
    this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
    this._velocity = new THREE.Vector3(0, 0, 0);

    document.addEventListener("keydown", (e) => this._onKeyDown(e), false);
    document.addEventListener("keyup", (e) => this._onKeyUp(e), false);
  }

  _onKeyDown(event) {
    switch (event.keyCode) {
      case 87: // w
        this._move.forward = true;
        break;
      case 65: // a
        this._move.left = true;
        break;
      case 83: // s
        this._move.backward = true;
        break;
      case 68: // d
        this._move.right = true;
        break;
      case 38: // up
      case 37: // left
      case 40: // down
      case 39: // right
        break;
    }
  }

  _onKeyUp(event) {
    switch (event.keyCode) {
      case 87: // w
        this._move.forward = false;
        break;
      case 65: // a
        this._move.left = false;
        break;
      case 83: // s
        this._move.backward = false;
        break;
      case 68: // d
        this._move.right = false;
        break;
      case 38: // up
      case 37: // left
      case 40: // down
      case 39: // right
        break;
    }
  }

  Update(timeInSeconds) {
    const velocity = this._velocity;
    const frameDecceleration = new THREE.Vector3(
      velocity.x * this._decceleration.x,
      velocity.y * this._decceleration.y,
      velocity.z * this._decceleration.z
    );
    frameDecceleration.multiplyScalar(timeInSeconds);
    frameDecceleration.z =
      Math.sign(frameDecceleration.z) *
      Math.min(Math.abs(frameDecceleration.z), Math.abs(velocity.z));

    velocity.add(frameDecceleration);

    const controlObject = this._params.target;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = controlObject.quaternion.clone();

    if (this._move.forward) {
      velocity.z += this._acceleration.z * timeInSeconds;
    }
    if (this._move.backward) {
      velocity.z -= this._acceleration.z * timeInSeconds;
    }
    if (this._move.left) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }
    if (this._move.right) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, -Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }

    controlObject.quaternion.copy(_R);

    const oldPosition = new THREE.Vector3();
    oldPosition.copy(controlObject.position);

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(controlObject.quaternion);
    forward.normalize();

    const sideways = new THREE.Vector3(1, 0, 0);
    sideways.applyQuaternion(controlObject.quaternion);
    sideways.normalize();

    sideways.multiplyScalar(velocity.x * timeInSeconds);
    forward.multiplyScalar(velocity.z * timeInSeconds);

    controlObject.position.add(forward);
    controlObject.position.add(sideways);

    oldPosition.copy(controlObject.position);
  }
}

// initialize variables
var controls, camera, scene, renderer, mixer, clock, actions, char_controls;
var moving = false;

// Canvas
const canvas = document.querySelector("canvas#bg");

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// main functions
init();
animate();
window.addEventListener("keydown", function (event) {
  console.log(moving);
  if (!moving) {
    mixer.stopAllAction();
    actions[1].fadeIn(0.2);
    actions[1].play();
  }
  moving = true;
});
window.addEventListener("keyup", function (event) {
  console.log(moving);
  moving = false;
  mixer.stopAllAction();
  actions[0].fadeIn(0.2);
  actions[0].play();
});

// initial function
function init() {
  // Base scene
  scene = new THREE.Scene();
  // scene.background = new THREE.Color(0xa8def0);

  const materialArray = createMaterialArray("Daylight");
  const skyboxGeo = new THREE.BoxGeometry(35, 35, 35);
  const skybox = new THREE.Mesh(skyboxGeo, materialArray);
  scene.add(skybox);

  // Base camera
  camera = new THREE.PerspectiveCamera(
    50,
    sizes.width / sizes.height,
    0.1,
    100
  );
  camera.position.set(0, 10, 30);
  scene.add(camera);

  // lights
  const hlight = new THREE.AmbientLight (0x404040, 3);
  hlight.position.set(0,10,-50);
  scene.add(hlight);
  // Shadow
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set( 20, 30, 20 );
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  directionalLight.shadow.camera.scale.set(3, 3, 3);
  const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
  scene.add(helper);
  // Clock
  clock = new THREE.Clock();

  // Loader
  var loader = new GLTFLoader();
  loader.load("./assets/duck/scene.gltf", function (gltf) {
    gltf.scene.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });
    const params = {
      target: gltf.scene,
      camera: camera,
    };
    char_controls = new BasicCharacterControls(params);
    scene.add(gltf.scene);
    mixer = new THREE.AnimationMixer(gltf.scene);
    actions = [];
    const idle_action = mixer.clipAction(gltf.animations[0]);
    const moving_action = mixer.clipAction(gltf.animations[1]);
    actions = [idle_action, moving_action];
    if (moving) {
      moving_action.play();
    } else {
      idle_action.play();
    }
    animate();
  });

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
  });

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  starGeo = new THREE.BufferGeometry();
  for (let i = 0; i < 6000; i++) {
    let star = new THREE.Vector3(
      Math.random() * 600 - 300,
      Math.random() * 600 - 300,
      Math.random() * 600 - 300
    );
    // starGeo.vertices.push(star);
  }
  // let sprite = new THREE.TextureLoader().load("./asstes/star.png")
  // let starMaterial = new THREE.PointsMaterial({
  //   color: 0xaaaaaa,
  //   size: 0.7,
  //   map:sprite
  // })

  // stars = new THREE.Points(starGeo,starMaterial);
  // scene.add(stars);
  // animate();

  window.addEventListener("resize", () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  // Controls
  controls = new OrbitControls(camera, canvas);
  controls.addEventListener("change", renderer);

  // Grass
  const texture = new THREE.TextureLoader().load("assets/grass.jpeg");

  // immediately use the texture for material creation
  const material = new THREE.MeshBasicMaterial({ map: texture });
  // Mesh
  const planeGeometry = new THREE.PlaneGeometry(35, 35)
  const plane = new THREE.Mesh(planeGeometry, new THREE.MeshStandardMaterial({ map: texture }))
  plane.receiveShadow = true;
  scene.add(plane);
  plane.rotation.x = Math.PI / 2;
  plane.rotation.y = Math.PI;
  plane.rotation.z = 0;

  //Create the trees
  placeTrees(scene);
  // cerca
  const cerca = new GLTFLoader();
  cerca.load("./assets/cerca/cerca.gltf", function (some) {
    some.scene.scale.set(1.15, 1.15, 1.15);
    some.scene.position.x = 3;
    some.scene.position.z = 2;

    scene.add(some.scene);
  });

  // barn
  // https://sketchfab.com/3d-models/farm-barn-b930b48e99934f698c52b92f4ec1e51a
  const barn = new GLTFLoader();
  barn.load("./assets/barn/barn.gltf", function (mybarn) {
    mybarn.scene.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });
    scene.add(mybarn.scene);
  });
}

// Animate
function animate() {
  requestAnimationFrame(animate);
  var delta = clock.getDelta();

  if (mixer) mixer.update(delta);

  renderer.render(scene, camera);

  if (moving) {
    char_controls.Update(delta * 0.2);
  }
}

function createTree() {
  // Trunk texture
  const texture = new THREE.TextureLoader().load("assets/trunk.jpeg");
  const materialT = new THREE.MeshStandardMaterial({ map: texture });

  // Leaves texture
  const texture2 = new THREE.TextureLoader().load("assets/leaves.jpeg");
  const materialL = new THREE.MeshStandardMaterial({ map: texture2 });

  const group = new THREE.Group();
  const level1 = new THREE.Mesh(new THREE.ConeGeometry(3, 3), materialL);
  level1.position.y = 7.5;
  level1.castShadow = true;
  group.add(level1);
  const level2 = new THREE.Mesh(new THREE.ConeGeometry(3.5, 3), materialL);
  level2.position.y = 5.5;
  level2.castShadow = true;
  group.add(level2);
  const level3 = new THREE.Mesh(new THREE.ConeGeometry(4.5, 3), materialL);
  level3.position.y = 3.5;
  level3.castShadow = true;
  group.add(level3);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 3), materialT);
  trunk.position.y = 1.5;
  trunk.castShadow = true;
  group.add(trunk);
  return group;
}

function placeTrees(scene) {
  let pos = 0;
  for (let i = 0; i < 2; i++, pos += 10) {
    const newTree = createTree();
    scene.add(newTree);
    newTree.position.x = 8;
    newTree.position.z = pos; 
    const newTree2 = createTree();
    scene.add(newTree2);
    newTree2.position.x = -8;
    newTree2.position.z = pos;
  }
}

function createPathStrings(filename) {
  const basePath = "./assets/skybox/";
  const baseFilename = basePath + filename;
  const fileType = ".bmp";
  const sides = ["ft", "bk", "up", "dn", "rt", "lf"];
  const pathStings = sides.map((side) => {
    return baseFilename + "_" + side + fileType;
  });
  return pathStings;
}

function createMaterialArray(filename) {
  const skyboxImagepaths = createPathStrings(filename);
  const materialArray = skyboxImagepaths.map((image) => {
    let texture = new THREE.TextureLoader().load(image);

    return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
  });
  return materialArray;
}
