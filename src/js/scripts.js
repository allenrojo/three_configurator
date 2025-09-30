import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { UIController } from './ui-controller.js';

const controllerUrl = new URL('../assets/controller.glb',import.meta.url);
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
    window.innerWidth/window.innerHeight,
    0.1,
    1000
);

const orbit = new OrbitControls(camera, renderer.domElement);

orbit.target.set(0, 1.5, 0);  // Slightly above the origin
orbit.update();

// You can also add these optional settings for better control:
orbit.enableDamping = true;      // Smooth camera movement
orbit.dampingFactor = 0.05;      // Smoothness amount
orbit.minDistance = 2;           // How close you can zoom
orbit.maxDistance = 10;   

// HDR environment
const rgbeLoader = new RGBELoader();
rgbeLoader.load('../assets/studio_small.hdr', function(texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
});

const axesHelper = new THREE.AxesHelper(5);
//scene.add(axesHelper);

const gridHelper = new THREE.GridHelper(30, 30);
//scene.add(gridHelper)

const meshMaterials = {};
const meshCache = {};

// Raycaster for click detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// store the UI controller
let uiController;

const assetLoader = new GLTFLoader();
assetLoader.load(controllerUrl.href, function(gltf) {
    const parts = {};
    const model = gltf.scene;
    scene.add(model);
    model.position.set(0,1.5,0);
    model.rotateX(.5);
    
    model.traverse((child) => {
        if (child.isMesh) {
            meshCache[child.name] = child;
            
            meshMaterials[child.name] = child.material.clone();
            
            child.castShadow = true;
            child.receiveShadow = true;
        
        }
        
        if (child.isMesh) {
            parts[child.name] = child;
        }
        
        if(meshCache["button_outer"]) {
            meshCache["button_outer"].material = glassMaterial;
            meshCache["button_outer"].material.needsUpdate = true;
        }
    });
    
    console.log(parts);
    uiController = new UIController(meshCache, meshMaterials, scene);
   
}, undefined, function(error) {
    console.error(error);
});

// soft area light
const softLight = new THREE.RectAreaLight(0xffffff, 5, 6, 6);
softLight.position.set(5, 8, 5);
softLight.lookAt(0, 1, 0);
scene.add(softLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 0);
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

const fillLight = new THREE.DirectionalLight(0xffffff, .4);
fillLight.position.set(-5, 5, -5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, .5);
rimLight.position.set(0, 8, -10);
scene.add(rimLight);

const underLight = new THREE.DirectionalLight(0xffffff, .2);
underLight.position.set(0, -5, 0);
scene.add(underLight);

const ambient = new THREE.AmbientLight(0xffffff, .6);
scene.add(ambient);

// real shadow
const shadowMat = new THREE.ShadowMaterial({ opacity: 0.3 });
const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  shadowMat
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = 0;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x4D4D4D,
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

camera.position.set(0,2,5);
orbit.update();

// Mouse click event listener
function onMouseClick(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Get all clickable meshes
    const clickableMeshes = Object.values(meshCache);
    
    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(clickableMeshes, false);
    
    if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        
        // Tell the UI controller to select this part
        if (uiController && clickedMesh.name) {
            uiController.selectPartByName(clickedMesh.name);
        }
    }
}

// Attach click listener to the renderer
renderer.domElement.addEventListener('click', onMouseClick, false);

// Visual feedback on hover (optional but nice)
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const clickableMeshes = Object.values(meshCache);
    const intersects = raycaster.intersectObjects(clickableMeshes, false);
    
    // Change cursor to pointer when hovering over a mesh
    if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
    } else {
        document.body.style.cursor = 'default';
    }
}

renderer.domElement.addEventListener('mousemove', onMouseMove, false);

function animate() {
  requestAnimationFrame(animate);
  orbit.update();
  renderer.render(scene, camera);
}
animate();