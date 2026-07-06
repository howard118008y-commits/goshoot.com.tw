// Go Shoot 官網首頁 Hero：真 3D 戰鬥陀螺（three.js，經 importmap 載入）
// 造型對標 Beyblade X 實品三層結構：銀色機甲戰刃 + 半透明琥珀齒輪環(Ratchet) + 半透明黃軸座(Bit)
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

// 中央徽章盤：Go Shoot 品牌標靶（對應實品的獸紋晶片）
function emblemTexture() {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), cx = S / 2;
  g.fillStyle = '#0F1116'; g.beginPath(); g.arc(cx, cx, 250, 0, 7); g.fill();
  // 外圈刻度環（實品盤面的機能感）
  g.strokeStyle = 'rgba(236,236,234,.85)'; g.lineWidth = 10;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * 206, cx + Math.sin(a) * 206);
    g.lineTo(cx + Math.cos(a) * 232, cx + Math.sin(a) * 232);
    g.stroke();
  }
  // 品牌標靶 logo
  g.strokeStyle = '#ECECEA'; g.lineWidth = 22;
  g.beginPath(); g.arc(cx, cx, 150, 0, 7); g.stroke();
  g.strokeStyle = 'rgba(236,236,234,.35)'; g.lineWidth = 12;
  g.beginPath(); g.arc(cx, cx, 104, 0, 7); g.stroke();
  g.fillStyle = '#FF6A4D'; g.beginPath(); g.arc(cx, cx, 62, 0, 7); g.fill();
  g.fillStyle = '#ECECEA'; g.beginPath(); g.arc(cx, cx, 24, 0, 7); g.fill();
  g.strokeStyle = '#FF6A4D'; g.lineWidth = 26; g.lineCap = 'round';
  g.beginPath(); g.arc(cx, cx, 186, -Math.PI / 2, 0); g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// 三迴對稱機甲戰刃輪廓：直線斷面＋外突翼板＋內凹缺口（角刃，不是花瓣）
function bladeGeometry() {
  const seq = [[0, 1.42], [26, 1.42], [33, 1.1], [50, 1.25], [58, 1.48], [66, 1.36], [84, 1.36], [92, 1.05], [106, 1.22], [118, 1.42]];
  const pts = [];
  for (let s = 0; s < 3; s++) for (const [a, r] of seq) {
    const th = ((s * 120 + a) * Math.PI) / 180;
    pts.push(new THREE.Vector2(Math.cos(th) * r, Math.sin(th) * r));
  }
  const shape = new THREE.Shape(pts);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.18, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 2, curveSegments: 1,
  });
  geo.rotateX(-Math.PI / 2);
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
  scene.environmentIntensity = 0.75;   // 銀色金屬要吃環境反射，但壓一點保留暗部對比

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);

  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 5, 4); scene.add(key);
  const coralL = new THREE.PointLight(CORAL, 24, 0, 2); coralL.position.set(2.6, 0.9, 2.4); scene.add(coralL);
  const limeL = new THREE.PointLight(LIME, 16, 0, 2); limeL.position.set(-3, 1.6, -2); scene.add(limeL);

  // ── 陀螺本體（三層：戰刃/齒輪環/軸座）──
  const top = new THREE.Group();
  const spinner = new THREE.Group();
  top.add(spinner); scene.add(top);
  top.scale.setScalar(0.72);

  const mSilver = new THREE.MeshStandardMaterial({ color: 0xA9ABB4, metalness: 0.95, roughness: 0.3 });
  const mSilver2 = new THREE.MeshStandardMaterial({ color: 0x83858E, metalness: 0.95, roughness: 0.34 });
  const mGun = new THREE.MeshStandardMaterial({ color: 0x4A4C54, metalness: 0.9, roughness: 0.42 });
  const mAmber = new THREE.MeshPhysicalMaterial({   // 半透明琥珀齒輪環（暗景用亮色＋微自發光撐住透明感）
    color: 0xF0A21E, transmission: 0.5, thickness: 0.6, roughness: 0.12, ior: 1.45,
    transparent: true, opacity: 0.92, clearcoat: 0.7, emissive: 0x7A4C00, emissiveIntensity: 0.3,
  });
  const mYellow = new THREE.MeshPhysicalMaterial({  // 半透明黃軸座
    color: 0xEDF07A, transmission: 0.45, thickness: 0.5, roughness: 0.18, ior: 1.4,
    transparent: true, opacity: 0.95, clearcoat: 0.6, emissive: 0x8A9224, emissiveIntensity: 0.22,
  });

  // 戰刃層：底盤 + 銀角刃 + 機甲細節
  const bladeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 1.02, 0.1, 48), mGun); spinner.add(bladeBase);
  const blade = new THREE.Mesh(bladeGeometry(), mSilver); blade.position.y = 0.02; spinner.add(blade);
  const blade2 = new THREE.Mesh(bladeGeometry(), mGun);          // 上層錯位刃：深槍鐵色，做出實品雙色斷差
  blade2.scale.set(0.8, 0.62, 0.8); blade2.rotation.y = Math.PI / 3; blade2.position.y = 0.2; spinner.add(blade2);
  const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 1.16, 0.13, 48), mSilver);    // 肩部斜坡
  shoulder.position.y = 0.3; spinner.add(shoulder);
  for (let i = 0; i < 3; i++) {                                   // 外突裝甲翼板（斜坡上）
    const tab = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.22), mSilver);
    const a = (i / 3) * Math.PI * 2 + 0.55;
    tab.position.set(Math.cos(a) * 0.78, 0.36, Math.sin(a) * 0.78);
    tab.rotation.y = -a; spinner.add(tab);
  }
  for (let i = 0; i < 6; i++) {                                   // 斜坡散熱刻線
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.05), mGun);
    const a = (i / 6) * Math.PI * 2 + 0.3;
    slit.position.set(Math.cos(a) * 0.72, 0.35, Math.sin(a) * 0.72);
    slit.rotation.y = -a + Math.PI / 2; spinner.add(slit);
  }
  // 中央徽章：青檸環 + 盤面
  const ringLime = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.54, 0.1, 48),
    new THREE.MeshPhysicalMaterial({ color: 0xC7D63F, emissive: LIME, emissiveIntensity: 0.25, roughness: 0.3, clearcoat: 0.8 })
  );
  ringLime.position.y = 0.38; spinner.add(ringLime);
  const emblem = new THREE.Mesh(
    new THREE.CircleGeometry(0.43, 48),
    new THREE.MeshStandardMaterial({ map: emblemTexture(), roughness: 0.35, metalness: 0.15 })
  );
  emblem.rotation.x = -Math.PI / 2; emblem.position.y = 0.432; spinner.add(emblem);

  // 齒輪環（Ratchet）：半透明琥珀 + 方齒
  const ratBase = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.76, 0.18, 48), mAmber); ratBase.position.y = -0.14; spinner.add(ratBase);
  for (let i = 0; i < 10; i++) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.24), mAmber);
    const a = (i / 10) * Math.PI * 2;
    tooth.position.set(Math.cos(a) * 0.9, -0.14, Math.sin(a) * 0.9);
    tooth.rotation.y = -a; spinner.add(tooth);
  }
  const ratCone = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.4, 0.16, 48), mAmber); ratCone.position.y = -0.3; spinner.add(ratCone);

  // 軸座（Bit）：半透明黃——寬緣 + 直紋軸身 + 圓頭尖
  const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.44, 0.07, 48), mYellow); flange.position.y = -0.4; spinner.add(flange);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.22, 32), mYellow); shaft.position.y = -0.54; spinner.add(shaft);
  for (let i = 0; i < 10; i++) {                                  // 軸身直紋肋條
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.05), mYellow);
    const a = (i / 10) * Math.PI * 2;
    rib.position.set(Math.cos(a) * 0.26, -0.54, Math.sin(a) * 0.26); spinner.add(rib);
  }
  const tipCone = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.08, 0.12, 32), mYellow); tipCone.position.y = -0.7; spinner.add(tipCone);
  const tipBall = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), mYellow); tipBall.position.y = -0.77; spinner.add(tipBall);

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
    map: radialTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0)', 64),
  }));
  scene.add(points);

  // ── 尺寸/視角 ──
  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.set(0, 0.8, camera.aspect < 0.8 ? 6.8 : 5.6);
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

    if (t < 0.95) {
      const k = easeOutBack(t / 0.95);
      top.position.y = 2.3 * (1 - k) - 0.16;
    } else if (!launched) {
      launched = true; top.position.y = -0.16; spd = 0.9; spawnShock();
      for (let i = 0; i < 90; i++) respawn(i, 2.2);
    }
    spd += ((launched ? 15 : 3) - spd) * 0.03;
    spinner.rotation.y += spd * dt;

    // 歲差搖擺（實品打斜旋轉的姿態）＋輕微漂移
    top.rotation.x = 0.3 + Math.sin(t * 0.7) * 0.12;   // 大歲差：搖擺時輪流露出徽章面與下層齒環/軸座
    top.rotation.z = Math.cos(t * 0.55) * 0.09;
    top.position.x = Math.sin(t * 0.55) * 0.09;

    ringA.rotation.z += dt * 0.25; ringB.rotation.z -= dt * 0.18;
    ringA.material.opacity = 0.24 + 0.1 * Math.sin(t * 1.6);
    ringB.material.opacity = 0.14 + 0.07 * Math.sin(t * 1.2 + 1);
    ringLime.material.emissiveIntensity = 0.2 + Math.max(0, Math.sin(t * 3)) * 0.25;

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
    camera.position.y = 0.8 - scrollOff;
    camera.lookAt(0, -0.1, 0);
    renderer.render(scene, camera);

    if (!faded) { faded = true; canvas.style.opacity = '1'; if (window.gshStop2D) setTimeout(window.gshStop2D, 950); }
  }
  requestAnimationFrame(frame);
  return true;
}
