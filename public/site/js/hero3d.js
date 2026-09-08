// Scène Three.js du hero : cristal en rotation lente, réactif à la souris.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const MODEL_URL = "/__l5e/assets-v1/5d24afbd-be7c-40c2-b209-ced3716a92c4/crystal.glb";

const mount = document.querySelector("[data-hero3d]");
if (mount && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 3.4);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.AmbientLight(0x8fb4ff, 0.5));
  const cyan = new THREE.PointLight(0x22d3ff, 22, 18);
  cyan.position.set(2.4, 1.6, 2.6);
  scene.add(cyan);
  const magenta = new THREE.PointLight(0xd946ef, 18, 18);
  magenta.position.set(-2.6, -1.4, 1.8);
  scene.add(magenta);
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(1, 2, 3);
  scene.add(key);

  const group = new THREE.Group();
  scene.add(group);

  const draco = new DRACOLoader().setDecoderPath("https://unpkg.com/three@0.169.0/examples/jsm/libs/draco/");
  const loader = new GLTFLoader().setDRACOLoader(draco);

  loader.load(MODEL_URL, (gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    model.scale.setScalar(2.6 / size);
    model.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material.envMapIntensity = 1.4;
        if ("metalness" in o.material) o.material.metalness = Math.max(o.material.metalness, 0.35);
        if ("roughness" in o.material) o.material.roughness = Math.min(o.material.roughness, 0.55);
      }
    });
    group.add(model);
    mount.classList.add("is-ready");
  });

  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  function resize() {
    const w = mount.clientWidth;
    const h = mount.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 }).observe(mount);

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const t = clock.getElapsedTime();
    pointer.x += (target.x - pointer.x) * 0.05;
    pointer.y += (target.y - pointer.y) * 0.05;
    group.rotation.y = t * 0.25 + pointer.x * 0.4;
    group.rotation.x = Math.sin(t * 0.4) * 0.08 + pointer.y * 0.25;
    group.position.y = Math.sin(t * 0.8) * 0.06;
    renderer.render(scene, camera);
  });
}
