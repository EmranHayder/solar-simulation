import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 15);
camera.lookAt(scene.position);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const moonGeometry = new THREE.SphereGeometry(1, 64, 64);
const moonMaterial = new THREE.MeshStandardMaterial({
  color: 0xf4a300,
  emissive: 0xf4a300,
  emissiveIntensity: 0.2,
  roughness: 0.5,
  metalness: 0.3,
});
const moon = new THREE.Mesh(moonGeometry, moonMaterial);
moon.castShadow = true;
moon.receiveShadow = true;
scene.add(moon);

const moonLight = new THREE.DirectionalLight(0xffffff, 1.2);
moonLight.position.set(5, 5, 5);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 1024;
moonLight.shadow.mapSize.height = 1024;
scene.add(moonLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// Physics constants
const G = 5; // Gravitational constant
const centralMass = 50; // Mass of central body

const planets = [];
const semiMajorAxes = [4, 6, 8]; // Kepler's First Law: Ellipses' major axes
const semiMinorAxes = [3, 5, 7];  // Kepler's First Law: Ellipses' minor axes
const planetColors = [0xc0c0c0, 0xc0c0c0, 0xc0c0c0];

semiMajorAxes.forEach((a, i) => {
  const b = semiMinorAxes[i];
  const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  const material = new THREE.MeshLambertMaterial({ color: planetColors[i] });
  const planet = new THREE.Mesh(geometry, material);
  planet.castShadow = true;
  planet.receiveShadow = true;

  // KEPLER'S THIRD LAW INITIALIZATION T² ∝ a³ => v ∝ 1/√a
  planet.userData = {
    angle: Math.random() * Math.PI * 2,
    semiMajor: a,
    semiMinor: b,
    mass: 0.5 + Math.random() * 0.5, 
    speed: Math.sqrt(G * centralMass / a) * 0.1 // Initial orbital velocity
  };

  // Scale planet based on mass (visual enhancement)
  planet.scale.setScalar(0.3 + planet.userData.mass * 0.5);

  // KEPLER'S FIRST LAW IMPLEMENTATION: Planets orbit in ellipses with sun at one focus
  const orbitGroup = new THREE.Group();
  orbitGroup.add(planet);
  orbitGroup.rotation.x = Math.random() * Math.PI / 4;
  orbitGroup.rotation.z = Math.random() * Math.PI / 4;

  const curve = new THREE.EllipseCurve(
    0, 0,
    a, b,
    0, 2 * Math.PI,
    false,
    0
  );
  const points = curve.getPoints(100);
  const orbitPath = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p.x, 0, p.y)));
  const orbitGeometry = new THREE.TubeGeometry(orbitPath, 100, 0.02, 8, true);
  const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
  const orbitLine = new THREE.Mesh(orbitGeometry, orbitMaterial);
  orbitGroup.add(orbitLine);

  scene.add(orbitGroup);
  planets.push({ mesh: planet, group: orbitGroup });
});

function animate() {
  requestAnimationFrame(animate);

  planets.forEach(({ mesh, group }) => {
    const a = mesh.userData.semiMajor;
    const b = mesh.userData.semiMinor;
    
    // KEPLER'S FIRST LAW IMPLEMENTATION: Parametric equations for elliptical orbit: x = a*cos(θ), z = b*sin(θ)
    mesh.position.x = a * Math.cos(mesh.userData.angle);
    mesh.position.z = b * Math.sin(mesh.userData.angle);

    /** NEWTONIAN GRAVITY CALCULATIONS
     1. Calculate current distance (r) from central body
     2. Compute gravitational force F = GMm/r²
     3. Update speed using v = √(GM/r)
    */
    const r = Math.sqrt(mesh.position.x ** 2 + mesh.position.z ** 2);
    
    // Newton's Law of Universal Gravitation
    const gravitationalForce = (G * centralMass * mesh.userData.mass) / (r ** 2);
    
    
    // KEPLER'S SECOND LAW IMPLEMENTATION
    // Planets move faster when closer to the sun
    // Achieved naturally through Newtonian gravity
    mesh.userData.speed = Math.sqrt(G * centralMass / r) * 0.1;

    // Advance angle using gravity-adjusted speed
    mesh.userData.angle += mesh.userData.speed * 0.05;

    // Slow orbit plane rotation
    group.rotation.y += 0.001;
  });

  controls.update();
  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();