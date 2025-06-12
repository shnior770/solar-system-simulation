import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';
import { CSS2DRenderer, CSS2DObject } from 'https://unpkg.com/three@0.165.0/examples/jsm/renderers/CSS2DRenderer.js';

// הגדרת סצנה, מצלמה ורנדרר (WebGL)
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- רנדרר עבור שמות (CSS2DRenderer) ---
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none'; // לאפשר אינטראקציה עם הקנבס שמתחת
document.getElementById('labels').appendChild(labelRenderer.domElement);


// --- אורות בסצנה (מחליפים את השמש כמקור אור) ---
const ambientLight = new THREE.AmbientLight(0x404040, 1); // אור אווירה עדין
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8); // אור כיווני, מדמה אור שמש מרוחק
directionalLight.position.set(500, 500, 500).normalize();
scene.add(directionalLight);


// --- טעינת טקסטורות ---
const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = ''; // פותר בעיות CORS

// טעינת טקסטורות ספציפיות
const earthTexture = textureLoader.load('textures/earth_texture.jpg');
const earthNormalMap = textureLoader.load('textures/earth_normal.jpg');
const earthCloudsMap = textureLoader.load('textures/earth_clouds.png');


// --- פונקציה ליצירת כוכב לכת (משמשת כעת בעיקר לכדור הארץ) ---
function createPlanet(size, texture, position, ring, name, normalMap, cloudsTexture) {
    const geometry = new THREE.SphereGeometry(size, 64, 64);
    const material = new THREE.MeshStandardMaterial({ map: texture, normalMap: normalMap });
    const mesh = new THREE.Mesh(geometry, material);

    const obj = new THREE.Object3D();
    obj.add(mesh);

    // --- קו מסלול (לא רלוונטי כרגע לכדור הארץ שנמצא ב-0,0,0, אבל הפונקציה עדיין גנרית) ---
    // נשאר בתוך הפונקציה למקרה שנוסיף ירח בעתיד
    if (position > 0) { // רק אם יש לו רדיוס מסלול
        const orbitGeometry = new THREE.TorusGeometry(position, 0.1, 16, 100); // עובי 0.1
        const orbitMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: false,
            opacity: 1,
            depthWrite: true,
            depthTest: true
        });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2;
        obj.add(orbit);
        mesh.position.set(position, 0, 0); // מיקום הכוכב על המסלול ההתחלתי
    } else {
        mesh.position.set(0, 0, 0); // כדור הארץ במרכז
    }

    if (ring) { // טיפול בטבעות (לא רלוונטי לכדור הארץ)
        const ringGeometry = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            map: ring.texture,
            side: THREE.DoubleSide,
            transparent: true
        });
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.rotation.x = Math.PI / 2;
        mesh.add(ringMesh);
    }

    // --- ענני כדור הארץ (רק אם יש textureClouds) ---
    if (cloudsTexture) {
        const cloudsGeometry = new THREE.SphereGeometry(size * 1.003, 64, 64);
        const cloudsMaterial = new THREE.MeshStandardMaterial({
            map: cloudsTexture,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
        mesh.add(clouds); // עננים כילד של הכדור
    }

    // --- יצירת התווית (שם) ---
    const planetDiv = document.createElement('div');
    planetDiv.className = 'label';
    planetDiv.textContent = name;
    const planetLabel = new CSS2DObject(planetDiv);
    const labelOffset = Math.max(size * 1.5, 0.5);
    planetLabel.position.set(0, labelOffset, 0);
    mesh.add(planetLabel);

    scene.add(obj);
    return { mesh, obj };
}

// --- הגדרת כדור הארץ (היחיד כרגע) ---
const planetsData = [
    // רק כדור הארץ נשאר, והוא מוגדר במרכז (orbitRadius: 0)
    { name: "כדור הארץ", planetRadius: 10, texture: earthTexture, normalMap: earthNormalMap, cloudsTexture: earthCloudsMap, orbitRadius: 0, orbitSpeed: 0.005 }
];

const planets = [];

planetsData.forEach(data => {
    let planetMesh;
    let obj;

    // יוצר את כדור הארץ עם העננים והמפה הנורמלית
    const result = createPlanet(data.planetRadius, data.