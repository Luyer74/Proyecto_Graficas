import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

//Loader
const loader = new GLTFLoader();
// Canvas
const canvas = document.querySelector("canvas#bg");

// Scene
const scene = new THREE.Scene();

// Objects

// Materials
const texture = new THREE.TextureLoader().load("assets/grass.jpeg");

// immediately use the texture for material creation
const material = new THREE.MeshBasicMaterial({ map: texture });
// Mesh
const geometry = new THREE.PlaneGeometry(3, 3);
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);
plane.rotation.x = Math.PI / 2;
plane.rotation.y = Math.PI;
plane.rotation.z = 0;
// Lights
const pointLight = new THREE.PointLight(0xffffff, 0.8);
pointLight.position.x = 2;
pointLight.position.y = 3;
pointLight.position.z = 4;
scene.add(pointLight);

const hlight = new THREE.AmbientLight(0x404040, 4);
hlight.position.set(0, 10, -50);
scene.add(hlight);

const alight = new THREE.PointLight(0xc4c4c4, 0.3);
alight.position.set(0, 300, -500);
scene.add(alight);

const light2 = new THREE.PointLight(0xc4c4c4, 0.1);
light2.position.set(50, 10, 0);
scene.add(light2);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

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

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 0;
camera.position.y = 1.2;
camera.position.z = 2;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */

const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update objects

  // Update Orbital Controls
  // controls.update()

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

//load
loader.load(
  "./assets/duck/scene.gltf",
  function (gltf) {
    scene.add(gltf.scene);
    gltf.scene.scale.set(0.4, 0.4, 0.4);
    tick();
    // mylight();
  },
  undefined,
  function (error) {
    console.error(error);
  }
);
