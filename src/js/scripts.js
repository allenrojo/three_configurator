import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const controllerUrl = new URL('../assets/controller.glb',import.meta.url);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth/window.innerHeight,
    0.1,
    1000
);

const orbit = new OrbitControls(camera, renderer.domElement);

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);
const gridHelper = new THREE.GridHelper(30, 30);
//scene.add(gridHelper);


const assetLoader = new GLTFLoader();
assetLoader.load(controllerUrl.href, function(gltf) {
    const model = gltf.scene;
    scene.add(model);
    model.position.set(0,1,0);

    model.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
                color: 0x1C1C1C,   
                metalness: 0.3,    
                roughness: 0.5     
            });
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    
}, undefined, function(error) {
    console.error(error);
} )

const keyLight = new THREE.DirectionalLight(0xffffff, 0.5);
keyLight.position.set(5, 10, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.radius = 4;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
fillLight.position.set(-5, 5, -5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
rimLight.position.set(0, 8, -10);
scene.add(rimLight);

const underLight = new THREE.DirectionalLight(0xffffff, 0.3);
underLight.position.set(0, -5, 0);
scene.add(underLight);

const ambient = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambient);

const shadowMat = new THREE.ShadowMaterial({ opacity: 0.3 }); // adjust opacity
const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  shadowMat
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = 0;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

camera.position.set(0,2,5);
orbit.update();

function animate() {
  requestAnimationFrame(animate);

  orbit.update(); 
  renderer.render(scene, camera);
}
animate();