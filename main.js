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

const planets = [];
const orbitRadius = [4, 6, 8];
const planetColors = [0xc0c0c0, 0xc0c0c0, 0xc0c0c0];

orbitRadius.forEach((radius, i) => {
  const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  const material = new THREE.MeshLambertMaterial({ color: planetColors[i] });
  const planet = new THREE.Mesh(geometry, material);
  planet.castShadow = true;
  planet.receiveShadow = true;

  planet.userData = {
    angle: Math.random() * Math.PI * 2,
    radius: radius,
    speed: 0.01 + Math.random() * 0.01,
  };

  const orbitGroup = new THREE.Group();
  orbitGroup.add(planet);
  orbitGroup.rotation.x = Math.random() * Math.PI / 4;
  orbitGroup.rotation.z = Math.random() * Math.PI / 4;

  const curve = new THREE.EllipseCurve(
    0, 0,
    radius, radius,
    0, 2 * Math.PI,
    false,
    0
  );
  const points = curve.getPoints(100);
  const orbitPath = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p.x, 0, p.y)));
  const orbitGeometry = new THREE.TubeGeometry(orbitPath, 100, 0.02, 8, true);
  const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const orbitLine = new THREE.Mesh(orbitGeometry, orbitMaterial);
  orbitGroup.add(orbitLine);

  scene.add(orbitGroup);
  planets.push({ mesh: planet, group: orbitGroup });
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);

  planets.forEach(({ mesh, group }) => {
    mesh.userData.angle += mesh.userData.speed;
    const r = mesh.userData.radius;
    const a = mesh.userData.angle;
    mesh.position.x = r * Math.cos(a);
    mesh.position.z = r * Math.sin(a);
    group.rotation.y += 0.001;
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();
