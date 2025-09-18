import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const controllerUrl = new URL('../assets/controller.glb',import.meta.url);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth/window.innerHeight,
    0.1,
    1000
);

const orbit = new OrbitControls(camera, renderer.domElement);

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

const assetLoader = new GLTFLoader();
assetLoader.load(controllerUrl.href, function(gltf) {
    const model = gltf.scene;
    scene.add(model);
    model.position.set(0,1,0);
}, undefined, function(error) {
    console.error(error);
} )

const gridHelper = new THREE.GridHelper(30, 30);
scene.add(gridHelper);


const directionalLight = new THREE.DirectionalLight(0xFFFFFF,0.8);
scene.add(directionalLight);

camera.position.set(0,2,5);
orbit.update();

function animate() {
  requestAnimationFrame(animate);

  orbit.update(); 
  renderer.render(scene, camera);
}
animate();