import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

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
  scene.background = new THREE.Color(0xa8def0);

  // Base camera
  camera = new THREE.PerspectiveCamera(
    50,
    sizes.width / sizes.height,
    0.1,
    100
  );
  camera.position.set(5, 3, 2);
  scene.add(camera);

  // lights
  const hlight = new THREE.AmbientLight(0xffffff, 2);
  hlight.position.set(0, 10, -50);
  scene.add(hlight);

  // Clock
  clock = new THREE.Clock();

  // Loader
  var loader = new GLTFLoader();
  loader.load("./assets/duck/scene.gltf", function (gltf) {
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
  controls.enableDamping = true;

  // Grass
  const texture = new THREE.TextureLoader().load("assets/grass.jpeg");

  // immediately use the texture for material creation
  const material = new THREE.MeshBasicMaterial({ map: texture });
  // Mesh
  const geometry = new THREE.PlaneGeometry(30, 30);
  const plane = new THREE.Mesh(geometry, material);
  scene.add(plane);
  plane.rotation.x = Math.PI / 2;
  plane.rotation.y = Math.PI;
  plane.rotation.z = 0;
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
