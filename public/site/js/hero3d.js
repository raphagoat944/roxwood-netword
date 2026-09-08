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

  // Limites de zoom personnalisables par montage (ex. page d'accueil plus large)
  const baseZoom = parseFloat(mount.dataset.zoomBase || "3.4");
  const minZoom = parseFloat(mount.dataset.zoomMin || "2.2");
  const maxZoom = parseFloat(mount.dataset.zoomMax || "5");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, baseZoom);

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

  // Interaction : glisser pour faire tourner le cristal, molette pour zoomer.
  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  const rot = { x: 0, y: 0 };
  const vel = { x: 0, y: 0 };
  let dragging = false;
  let dragged = false;
  let last = { x: 0, y: 0 };
  let idle = 0;
  let zoom = baseZoom;

  window.addEventListener("pointermove", (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  mount.addEventListener("pointerdown", (e) => {
    dragging = true;
    dragged = false;
    idle = 0;
    last = { x: e.clientX, y: e.clientY };
    mount.setPointerCapture(e.pointerId);
    mount.style.cursor = "grabbing";
  });

  mount.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    last = { x: e.clientX, y: e.clientY };
    if (Math.abs(dx) + Math.abs(dy) > 2) dragged = true;
    vel.y = dx * 0.006;
    vel.x = dy * 0.006;
    rot.y += vel.y;
    rot.x = Math.max(-1.2, Math.min(1.2, rot.x + vel.x));
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    mount.style.cursor = "grab";
    if (e && e.pointerId !== undefined && mount.hasPointerCapture(e.pointerId)) {
      mount.releasePointerCapture(e.pointerId);
    }
  }
  mount.addEventListener("pointerup", endDrag);
  mount.addEventListener("pointercancel", endDrag);
  mount.addEventListener("pointerleave", endDrag);

  mount.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoom = Math.max(minZoom, Math.min(maxZoom, zoom + e.deltaY * 0.0016));
  }, { passive: false });

  mount.addEventListener("dblclick", () => {
    rot.x = 0;
    rot.y = 0;
    vel.x = 0;
    vel.y = 0;
    zoom = baseZoom;
    idle = 0;
  });

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
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (!dragging) {
      // inertie puis reprise douce de la rotation automatique
      rot.y += vel.y;
      rot.x = Math.max(-1.2, Math.min(1.2, rot.x + vel.x));
      const damp = Math.exp(-3.2 * dt);
      vel.x *= damp;
      vel.y *= damp;
      idle += dt;
      if (idle > 2.5 && Math.abs(vel.y) < 0.001) rot.y += 0.25 * dt;
    } else {
      idle = 0;
    }

    pointer.x += (target.x - pointer.x) * 0.05;
    pointer.y += (target.y - pointer.y) * 0.05;

    group.rotation.y = rot.y + pointer.x * 0.2;
    group.rotation.x = rot.x + Math.sin(t * 0.4) * 0.06 + pointer.y * 0.12;
    group.position.y = Math.sin(t * 0.8) * 0.06;

    camera.position.z += (zoom - camera.position.z) * 0.08;
    renderer.render(scene, camera);
  });
}
