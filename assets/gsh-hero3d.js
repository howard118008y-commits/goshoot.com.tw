// Go Shoot 官網首頁 Hero：真 3D 戰鬥陀螺（three.js，經 importmap 載入）
// 漸進式增強：由 index.html 在 load 後動態 import；成功後淡入並停掉 2D 備援。
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const CORAL = 0xFF6A4D, GOLD = 0xFFC24B, LIME = 0xB6F500;

function radialTexture(inner, outer, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, inner); grad.addColorStop(1, outer);
  g.fillStyle = grad; g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 六刃攻擊型戰刃輪廓：快起慢收的鋸旋剖面 → 有「揮砍感」的刀刃
function bladeGeometry() {
  const pts = [];
  const N = 6, steps = 360;
  for (let i = 0; i <= steps; i++) {
    const th = (i / steps) * Math.PI * 2;
    const u = ((th * N) / (Math.PI * 2)) % 1;
    const prof = u < 0.55 ? Math.pow(u / 0.55, 0.55) : Math.pow(1 - (u - 0.55) / 0.45, 3.2);
    const rad = 0.9 + 0.72 * prof;
    pts.push(new THREE.Vector2(Math.cos(th) * rad, Math.sin(th) * rad));
  }
  const shape = new THREE.Shape(pts);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.14, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.04, bevelSegments: 3, curveSegments: 4,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -0.1, 0);
  return geo;
}

export async function initGshHero3D(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return false; }
  if (!renderer.getContext()) return false;

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;   // 環境反射壓低：留金屬感、不洗白品牌色

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);

  // ── 燈光：白主光＋珊瑚/青檸兩側色光（品牌雙色打在金屬上）──
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 5, 4); scene.add(key);
  const coralL = new THREE.PointLight(CORAL, 60, 0, 2); coralL.position.set(2.6, 0.9, 2.4); scene.add(coralL);
  const limeL = new THREE.PointLight(LIME, 36, 0, 2); limeL.position.set(-3, 1.6, -2); scene.add(limeL);

  // ── 陀螺本體 ──
  const top = new THREE.Group();       // 位置/傾角（進場、歲差搖擺）
  const spinner = new THREE.Group();   // 高速自轉層
  top.add(spinner); scene.add(top);
  top.scale.setScalar(0.72);           // 構圖：陀螺讓位給標題與 CTA

  const mBlade = new THREE.MeshStandardMaterial({ color: 0xE84A28, metalness: 0.9, roughness: 0.3 });
  const mBlade2 = new THREE.MeshStandardMaterial({ color: 0xD99A2E, metalness: 0.94, roughness: 0.24 });
  const mDark = new THREE.MeshStandardMaterial({ color: 0x2b2b33, metalness: 0.88, roughness: 0.38 });
  const mSteel = new THREE.MeshStandardMaterial({ color: 0x9a9aa4, metalness: 0.96, roughness: 0.3 });

  const blade = new THREE.Mesh(bladeGeometry(), mBlade); spinner.add(blade);
  const blade2 = new THREE.Mesh(bladeGeometry(), mBlade2);
  blade2.scale.set(0.78, 0.7, 0.78); blade2.position.y = -0.06; blade2.rotation.y = Math.PI / 6;
  spinner.add(blade2);

  const ratchet = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.95, 0.17, 12, 1), mDark);
  ratchet.geometry = ratchet.geometry.toNonIndexed(); ratchet.geometry.computeVertexNormals();
  ratchet.material = mDark.clone(); ratchet.material.flatShading = true;
  ratchet.position.y = -0.22; spinner.add(ratchet);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.58, 0.2, 48), mDark); cap.position.y = 0.2; spinner.add(cap);
  const ringLime = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.03, 12, 64),
    new THREE.MeshStandardMaterial({ color: 0x111111, emissive: LIME, emissiveIntensity: 2.6, metalness: 0.3, roughness: 0.5 })
  );
  ringLime.rotation.x = Math.PI / 2; ringLime.position.y = 0.3; spinner.add(ringLime);
  const jewel = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: CORAL, emissive: CORAL, emissiveIntensity: 0.7, metalness: 0.6, roughness: 0.25 })
  );
  jewel.position.y = 0.3; spinner.add(jewel);
  const tipShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.07, 0.46, 32), mSteel); tipShaft.position.y = -0.5; spinner.add(tipShaft);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), mSteel); tip.position.y = -0.74; spinner.add(tip);

  // ── 地面光暈與能量環 ──
  const GROUND = -0.86;
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 6),
    new THREE.MeshBasicMaterial({ map: radialTexture('rgba(255,106,77,.3)', 'rgba(255,106,77,0)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  glow.rotation.x = -Math.PI / 2; glow.position.y = GROUND; scene.add(glow);

  const aura = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radialTexture('rgba(255,140,90,.5)', 'rgba(255,106,77,0)'), transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55,
  }));
  aura.material.opacity = 0.32;
  aura.scale.set(5.2, 5.2, 1); aura.position.set(0, 0.1, -1.4); scene.add(aura);

  const mkRing = (r, color, op) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 8, 96),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = Math.PI / 2; m.position.y = GROUND + 0.02; scene.add(m); return m;
  };
  const ringA = mkRing(1.9, CORAL, 0.3), ringB = mkRing(2.55, LIME, 0.18);

  // ── 衝擊波 ──
  const shocks = [];
  function spawnShock() {
    const m = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.02, 8, 80),
      new THREE.MeshBasicMaterial({ color: CORAL, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = Math.PI / 2; m.position.y = GROUND + 0.03; m.userData.age = 0;
    scene.add(m); shocks.push(m);
  }

  // ── 火花粒子 ──
  const SPARKS = 240;
  const pGeo = new THREE.BufferGeometry();
  const pos = new Float32Array(SPARKS * 3), col = new Float32Array(SPARKS * 3);
  const vel = new Float32Array(SPARKS * 3), life = new Float32Array(SPARKS), baseC = new Float32Array(SPARKS * 3);
  const palette = [new THREE.Color(CORAL), new THREE.Color(GOLD), new THREE.Color(LIME)];
  function respawn(i, boost) {
    const a = Math.random() * Math.PI * 2, r = 1.45 + Math.random() * 0.2;
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = -0.1 + Math.random() * 0.2; pos[i * 3 + 2] = Math.sin(a) * r;
    const s = (0.8 + Math.random() * 1.6) * (boost || 1);
    vel[i * 3] = Math.cos(a + 1.35) * s; vel[i * 3 + 1] = 0.6 + Math.random() * 1.4 * (boost || 1); vel[i * 3 + 2] = Math.sin(a + 1.35) * s;
    life[i] = 0.7 + Math.random() * 0.5;
    const c = palette[(Math.random() * 3) | 0];
    baseC[i * 3] = c.r; baseC[i * 3 + 1] = c.g; baseC[i * 3 + 2] = c.b;
  }
  for (let i = 0; i < SPARKS; i++) { respawn(i, 1); life[i] *= Math.random(); }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const points = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.09, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    map: radialTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0)', 64),   // 圓形光點，不是方塊
  }));
  scene.add(points);

  // ── 尺寸/視角 ──
  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.set(0, 1.12, camera.aspect < 0.8 ? 6.8 : 5.6);
    camera.updateProjectionMatrix();
  }
  resize(); addEventListener('resize', resize);

  // ── 動畫 ──
  const clock = new THREE.Clock();
  let t = 0, spd = 0, launched = false, scrollOff = 0, visible = true, faded = false;
  addEventListener('scroll', () => { scrollOff = Math.min(scrollY, innerHeight) * 0.0011; }, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(canvas);
  }

  const easeOutBack = (x) => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2);

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;

    // 進場：從上方砸落（發射感），落地觸發爆花＋衝擊波
    if (t < 0.95) {
      const k = easeOutBack(t / 0.95);
      top.position.y = 2.3 * (1 - k) - 0.02;
    } else if (!launched) {
      launched = true; top.position.y = -0.02; spd = 0.9; spawnShock();
      for (let i = 0; i < 90; i++) respawn(i, 2.2);
    }
    spd += ((launched ? 15 : 3) - spd) * 0.03;
    spinner.rotation.y += spd * dt;

    // 歲差搖擺＋輕微漂移＝「活著」的陀螺
    top.rotation.x = 0.16 + Math.sin(t * 0.9) * 0.045;
    top.rotation.z = Math.cos(t * 0.7) * 0.05;
    top.position.x = Math.sin(t * 0.55) * 0.09;

    ringA.rotation.z += dt * 0.25; ringB.rotation.z -= dt * 0.18;
    ringA.material.opacity = 0.24 + 0.1 * Math.sin(t * 1.6);
    ringB.material.opacity = 0.14 + 0.07 * Math.sin(t * 1.2 + 1);
    ringLime.material.emissiveIntensity = 2.2 + Math.sin(t * 3) * 0.7;

    if (launched && t % 3.4 < dt) spawnShock();
    for (let i = shocks.length - 1; i >= 0; i--) {
      const s = shocks[i]; s.userData.age += dt;
      const k = s.userData.age / 1.2;
      if (k >= 1) { scene.remove(s); s.geometry.dispose(); s.material.dispose(); shocks.splice(i, 1); continue; }
      const sc = 1 + k * 2.4; s.scale.set(sc, sc, 1); s.material.opacity = 0.5 * (1 - k);
    }

    for (let i = 0; i < SPARKS; i++) {
      life[i] -= dt;
      if (life[i] <= 0) respawn(i, launched ? 1 : 0.6);
      vel[i * 3 + 1] -= 2.6 * dt;
      pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      const f = Math.max(life[i], 0);
      col[i * 3] = baseC[i * 3] * f; col[i * 3 + 1] = baseC[i * 3 + 1] * f; col[i * 3 + 2] = baseC[i * 3 + 2] * f;
    }
    pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;

    camera.position.x = Math.sin(t * 0.12) * 0.5;
    camera.position.y = 1.12 - scrollOff;
    camera.lookAt(0, -0.12, 0);
    renderer.render(scene, camera);

    if (!faded) { faded = true; canvas.style.opacity = '1'; if (window.gshStop2D) setTimeout(window.gshStop2D, 950); }
  }
  requestAnimationFrame(frame);
  return true;
}
