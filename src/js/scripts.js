import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { UIController } from './ui-controller.js';
import modelUrl from '/models/controller.glb?url';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// color management
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const orbit = new OrbitControls(camera, renderer.domElement);

orbit.target.set(0, 1.5, 0); // Slightly above the origin
orbit.update();

// Optional settings
orbit.enableDamping = true;
orbit.dampingFactor = 0.02;
orbit.minDistance = 2;
orbit.maxDistance = 5;

const meshMaterials = {};
const meshCache = {};

// Raycaster for click detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// store the UI controller
let uiController;

// ✅ glassMaterial defined BEFORE loader
const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xFFFFFF,
  metalness: 0,
  roughness: 0,
  transmission: 1,
  thickness: 0.2,
  transparent: true,
  opacity: 1,
  ior: 1,
  clearcoat: 1,
  clearcoatRoughness: 0,
});

// Load GLB model
const assetLoader = new GLTFLoader();
assetLoader.load(
  modelUrl,
  function (gltf) {
    console.log('✅ MODEL LOADED!', gltf);
    const parts = {};
    const model = gltf.scene;
    scene.add(model);
    model.position.set(0, 1.5, 0);
    model.rotateX(0.5);

    model.traverse((child) => {
      if (child.isMesh) {
        meshCache[child.name] = child;
        meshMaterials[child.name] = child.material.clone();

        child.castShadow = true;
        child.receiveShadow = true;

        parts[child.name] = child;
      }
    });

    // Apply glass material if button_outer exists
    if (meshCache['button_outer']) {
      meshCache['button_outer'].material = glassMaterial;
      meshCache['button_outer'].material.needsUpdate = true;
    }

    console.log('Loaded parts:', parts);
    uiController = new UIController(meshCache, meshMaterials, scene);
  },
  undefined,
  async function (error) {
    console.error('GLTFLoader error:', error);
    try {
      const res = await fetch(modelUrl);
      const txt = await res.text();
      console.warn('File response preview:', txt.slice(0, 200));
    } catch (e) {
      console.error('File fetch failed:', e);
    }
  }
);

// === Lighting ===
// const softLight = new THREE.RectAreaLight(0xffffff, 5, 6, 6);
// softLight.position.set(5, 8, 5);
// softLight.lookAt(0, 1, 0);
// scene.add(softLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1);
mainLight.position.set(0, 8, 5);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 4096;
mainLight.shadow.mapSize.height = 4096;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 50;
mainLight.shadow.camera.left = -10;
mainLight.shadow.camera.right = 10;
mainLight.shadow.camera.top = 10;
mainLight.shadow.camera.bottom = -10;
mainLight.shadow.radius = 10;
mainLight.shadow.blurSamples = 25;
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
fillLight.position.set(-5, 5, -5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
rimLight.position.set(0, 8, -10);
scene.add(rimLight);

const underLight = new THREE.DirectionalLight(0xffffff, 0.2);
underLight.position.set(0, -5, 0);
scene.add(underLight);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

// === Shadow Plane ===
const shadowMat = new THREE.ShadowMaterial({ opacity: 0.3 });
const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), shadowMat);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = 0;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

camera.position.set(0, 2, 5);
orbit.update();

// === Mouse Events ===
function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const clickableMeshes = Object.values(meshCache);
  const intersects = raycaster.intersectObjects(clickableMeshes, false);

  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;
    if (uiController && clickedMesh.name) {
      uiController.selectPartByName(clickedMesh.name);
    }
  }
}
renderer.domElement.addEventListener('click', onMouseClick, false);

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const clickableMeshes = Object.values(meshCache);
  const intersects = raycaster.intersectObjects(clickableMeshes, false);

  document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
}
renderer.domElement.addEventListener('mousemove', onMouseMove, false);

// === Animation Loop ===
let logged = false;
function animate() {
  requestAnimationFrame(animate);
  orbit.update();
  if (!logged) {
    console.log('Scene children:', scene.children.length);
    console.log('Camera position:', camera.position);
    console.log('Camera looking at:', orbit.target);
    logged = true;
  }
  renderer.render(scene, camera);
}
animate();
