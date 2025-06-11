import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';

// הגדרת סצנה, מצלמה ורנדרר
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000); // הגדלנו את הטווח של המצלמה
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- אור בסצנה ---
// נסיר את DirectionalLight ואת AmbientLight כדי שהשמש עצמה תאיר את הכוכבים
// (תספק אור מ"מרכז" המערכת)
// sunLight ו-ambientLight הוסרו
const pointLight = new THREE.PointLight(0xFFFFFF, 1.5, 2000); // אור נקודתי חזק מאוד ממרכז הסצנה
scene.add(pointLight);

// --- טעינת טקסטורות ---
const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = ''; // פותר בעיות CORS בטעינת טקסטורות מקומיות

// טעינת טקסטורות ספציפיות
const earthTexture = textureLoader.load('textures/earth_texture.jpg');
const earthNormalMap = textureLoader.load('textures/earth_normal.jpg');
const earthCloudsMap = textureLoader.load('textures/earth_clouds.png');
const sunTexture = textureLoader.load('textures/sun_texture.jpg');
const mercuryTexture = textureLoader.load('textures/mercury_texture.jpg');
const venusTexture = textureLoader.load('textures/venus_texture.jpg');
const marsTexture = textureLoader.load('textures/mars_texture.jpg');
const jupiterTexture = textureLoader.load('textures/jupiter_texture.jpg');
const saturnTexture = textureLoader.load('textures/saturn_texture.jpg');
const saturnRingTexture = textureLoader.load('textures/saturn_ring.png');
const uranusTexture = textureLoader.load('textures/uranus_texture.jpg');
const neptuneTexture = textureLoader.load('textures/neptune_texture.jpg');


// --- פונקציה ליצירת כוכב לכת (כולל קו מסלול) ---
function createPlanet(size, texture, position, ring) {
    const geometry = new THREE.SphereGeometry(size, 64, 64);
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);

    const obj = new THREE.Object3D(); // אובייקט ריק שיכיל את הכוכב וקו המסלול שלו
    obj.add(mesh); // הוסף את הכוכב לאובייקט הריק

    // קו מסלול (לבן)
    const orbitGeometry = new THREE.TorusGeometry(position, 0.005, 16, 100); // רדיוס, עובי
    const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }); // לבן
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2; // סובב את הטבעת כך שתהיה מישורית
    obj.add(orbit); // הוסף את המסלול לאובייקט הריק

    // מיקום כוכב הלכת על המסלול ההתחלתי שלו
    mesh.position.set(position, 0, 0); // ממוקם על ציר ה-X, במרחק ה-position

    if (ring) {
        // טבעות שבתאי
        const ringGeometry = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            map: ring.texture,
            side: THREE.DoubleSide, // נראה משני הצדדים
            transparent: true // מאפשר שקיפות עבור קובץ PNG
        });
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.rotation.x = Math.PI / 2; // סובב את הטבעות למישוריות
        mesh.add(ringMesh); // הוסף את הטבעות כילד של כוכב הלכת!
    }

    scene.add(obj); // הוסף את האובייקט הראשי (כוכב לכת + מסלול) לסצנה
    return { mesh, obj }; // נחזיר את שניהם לצורך אנימציה
}

// --- יצירת השמש ---
// השמש היא אור בעצמה, לכן נשתמש ב-MeshBasicMaterial ללא צורך באור חיצוני שיאיר אותה
const sunGeometry = new THREE.SphereGeometry(10, 64, 64); // השמש גדולה יותר
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture }); // מאיר את עצמו
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);


// --- יצירת כוכבי לכת ---
// נתונים אלו הם בקנה מידה, לא ערכים אמיתיים, כדי שיתאימו לתצוגה
// planetRadius: רדיוס הכוכב
// orbitRadius: רדיוס המסלול סביב השמש
// orbitSpeed: מהירות הקפה (ערכים קטנים כדי שיהיה ניתן לראות את התנועה)
const planetsData = [
    { name: "Mercury", planetRadius: 0.3, texture: mercuryTexture, orbitRadius: 20, orbitSpeed: 0.048 },
    { name: "Venus", planetRadius: 0.7, texture: venusTexture, orbitRadius: 30, orbitSpeed: 0.035 },
    { name: "Earth", planetRadius: 1, texture: earthTexture, normalMap: earthNormalMap, cloudsTexture: earthCloudsMap, orbitRadius: 40, orbitSpeed: 0.03 },
    { name: "Mars", planetRadius: 0.5, texture: marsTexture, orbitRadius: 50, orbitSpeed: 0.024 },
    { name: "Jupiter", planetRadius: 3, texture: jupiterTexture, orbitRadius: 80, orbitSpeed: 0.013 },
    { name: "Saturn", planetRadius: 2.5, texture: saturnTexture, orbitRadius: 110, orbitSpeed: 0.009, ring: { innerRadius: 3, outerRadius: 5, texture: saturnRingTexture } },
    { name: "Uranus", planetRadius: 1.8, texture: uranusTexture, orbitRadius: 140, orbitSpeed: 0.007 },
    { name: "Neptune", planetRadius: 1.7, texture: neptuneTexture, orbitRadius: 170, orbitSpeed: 0.005 }
];

const planets = []; // מערך שיחזיק את כל אובייקטי הכוכבים והמסלולים שלהם

planetsData.forEach(data => {
    let planetMesh;
    let obj;

    if (data.name === "Earth") {
        // כדור הארץ עם עננים ומפה נורמלית
        const earthGeometry = new THREE.SphereGeometry(data.planetRadius, 64, 64);
        const earthMaterial = new THREE.MeshStandardMaterial({
            map: data.texture,
            normalMap: data.normalMap
        });
        planetMesh = new THREE.Mesh(earthGeometry, earthMaterial);

        const cloudsGeometry = new THREE.SphereGeometry(data.planetRadius * 1.003, 64, 64);
        const cloudsMaterial = new THREE.MeshStandardMaterial({
            map: data.cloudsTexture,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
        planetMesh.add(clouds); // עננים כילד של כדור הארץ

        obj = new THREE.Object3D();
        obj.add(planetMesh);

        // קו מסלול
        const orbitGeometry = new THREE.TorusGeometry(data.orbitRadius, 0.005, 16, 100);
        const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2;
        obj.add(orbit);

        planetMesh.position.set(data.orbitRadius, 0, 0);

    } else {
        // שאר כוכבי הלכת
        const result = createPlanet(data.planetRadius, data.texture, data.orbitRadius, data.ring);
        planetMesh = result.mesh;
        obj = result.obj;
    }

    planets.push({
        mesh: planetMesh, // הכוכב עצמו (לצורך סיבוב עצמי)
        obj: obj, // האובייקט הראשי (כוכב + מסלול)
        orbitSpeed: data.orbitSpeed,
        orbitRadius: data.orbitRadius
    });
});


// מיקום מצלמה
// ממוקם גבוה יותר ומסתכל על מרכז מערכת השמש
camera.position.set(0, 200, 200); // X, Y, Z
camera.lookAt(0, 0, 0);


// --- פונקציית אנימציה ---
function animate() {
    requestAnimationFrame(animate);

    // סיבוב השמש סביב צירו
    sun.rotation.y += 0.001;

    // סיבוב כוכבי הלכת סביב ציריהם ותנועה מסלולית סביב השמש
    planets.forEach(planet => {
        // סיבוב עצמי
        planet.mesh.rotation.y += 0.005; // כל כוכב לכת יסתובב

        // תנועה מסלולית סביב השמש
        // שימוש בזמן כדי לקבוע את הזווית הנוכחית על המסלול
        const time = Date.now() * 0.0001; // קנה מידה של הזמן
        planet.obj.rotation.y = time * planet.orbitSpeed; // סיבוב האובייקט הראשי סביב ה-Y (מרכז)

        // אם זה כדור הארץ, סובב גם את העננים
        if (planet.mesh.children.length > 0 && planet.mesh.children[0].material.map === earthCloudsMap) {
             planet.mesh.children[0].rotation.y += 0.006;
        }

    });

    // תנועה ספירלית למערכת כולה (מדמה תנועה סביב מרכז הגלקסיה)
    // זו פשוט תוספת קטנה למיקום המצלמה (או כל המערכת)
    // אם נרצה להראות את המערכת זזה בחלל:
    // scene.position.z += 0.01; // הזז את כל הסצנה קדימה/אחורה

    renderer.render(scene, camera);
}

animate();

// טיפול בשינוי גודל חלון
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});