import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

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
  scene.background = new THREE.Color("rgb(0, 0, 0)");

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
  // Shadow
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.x += 20;
  directionalLight.position.y += 20;
  directionalLight.position.z += 20;
  directionalLight.castingShadow = true;
  scene.add(directionalLight);
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
  renderer.shadowMap.enabled = true;

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
  const geometry = new THREE.PlaneGeometry(35, 35);
  const plane = new THREE.Mesh(geometry, material);
  scene.add(plane);
  plane.rotation.x = Math.PI / 2;
  plane.rotation.y = Math.PI;
  plane.rotation.z = 0;

  // cerca
  const cerca = new GLTFLoader();
  cerca.load("./assets/cerca/cerca.gltf", function (some) {
    scene.add(some.scene);
  });

  // barn
  // https://sketchfab.com/3d-models/farm-barn-b930b48e99934f698c52b92f4ec1e51a
  const barn = new GLTFLoader();
  barn.load("./assets/barn/barn.gltf", function (mybarn) {
    scene.add(mybarn.scene);
  });
  let materialArray = [];
  let texture_ft = new THREE.TextureLoader().load(
    "./assets/newsky/penguins (2)/arid2_ft.jpg"
  );
  let texture_bk = new THREE.TextureLoader().load(
    "./assets/newsky/penguins (2)/arid2_bk.jpg"
  );
  let texture_up = new THREE.TextureLoader().load(
    "./assets/newsky/penguins (2)/arid2_up.jpg"
  );
  let texture_dn = new THREE.TextureLoader().load(
    "./assets/newsky/penguins (2)/arid2_dn.jpg"
  );
  let texture_rt = new THREE.TextureLoader().load(
    "./assets/newsky/penguins (2)/arid2_rt.jpg"
  );
  let texture_lf = new THREE.TextureLoader().load(
    "./assets/newsky/penguins (2)/arid2_lf.jpg"
  );

  materialArray.push(new THREE.MeshBasicMaterial({ map: texture_ft }));
  materialArray.push(new THREE.MeshBasicMaterial({ map: texture_bk }));
  materialArray.push(new THREE.MeshBasicMaterial({ map: texture_up }));
  materialArray.push(new THREE.MeshBasicMaterial({ map: texture_dn }));
  materialArray.push(new THREE.MeshBasicMaterial({ map: texture_rt }));
  materialArray.push(new THREE.MeshBasicMaterial({ map: texture_lf }));

  for (let i = 0; i < 6; i++) {
    materialArray[i].side = THREE.BackSide;
  }

  let skyboxGeo = new THREE.BoxGeometry(10000, 10000, 10000);
  let skybox = new THREE.Mesh(skyboxGeo, materialArray);
  scene.add(skybox);
  animate();
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
