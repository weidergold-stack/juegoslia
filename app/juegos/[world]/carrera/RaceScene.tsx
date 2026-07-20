"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { World } from "../../../lib/worlds";
import { LevelTheme } from "./levels";
import { createEngineSound } from "./engineSound";
import { isSpeechEnabled } from "../../../lib/speech";

const LANES = [-2.4, 0, 2.4];
const LANE_STEP = 2.4;
const MAX_X = 2.7;
const DRAG_SENSITIVITY = 0.016;
const COLLISION_X = 1.5;
const CAR_GAP = 2.8;

// All speedFactors stay below 1 so the player's base speed can always
// eventually catch and pass every rival — a slower car should never be
// mathematically impossible to overtake.
const RIVAL_CONFIGS = [
  { lane: 0, color: "#ef4444", speedFactor: 0.62, startZ: -6 },
  { lane: 2, color: "#3b82f6", speedFactor: 0.68, startZ: -14 },
  { lane: 1, color: "#f59e0b", speedFactor: 0.75, startZ: -24 },
  { lane: 0, color: "#a855f7", speedFactor: 0.82, startZ: -38 },
  { lane: 2, color: "#22c55e", speedFactor: 0.88, startZ: -55 },
  { lane: 1, color: "#ec4899", speedFactor: 0.94, startZ: -75 },
];

function buildStarGeometry() {
  const shape = new THREE.Shape();
  const points = 5;
  const outerR = 0.45;
  const innerR = 0.19;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.18,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.03,
    bevelSegments: 2,
  });
}

function buildCar(accentColor: string, glossy: boolean) {
  const car = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const bodyMat = glossy
    ? new THREE.MeshPhysicalMaterial({
        color: accentColor,
        metalness: 0.6,
        roughness: 0.25,
        clearcoat: 1,
        clearcoatRoughness: 0.15,
      })
    : new THREE.MeshStandardMaterial({
        color: accentColor,
        metalness: 0.5,
        roughness: 0.35,
      });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 3.2), bodyMat);
  body.position.y = 0.5;
  body.castShadow = true;
  car.add(body);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 1.1), bodyMat);
  hood.position.set(0, 0.62, -1.35);
  hood.rotation.x = -0.08;
  car.add(hood);

  const trunkLid = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 0.9), bodyMat);
  trunkLid.position.set(0, 0.62, 1.35);
  trunkLid.rotation.x = 0.06;
  car.add(trunkLid);

  const cabinMat = glossy
    ? new THREE.MeshStandardMaterial({
        color: "#141b24",
        metalness: 0.3,
        roughness: 0.15,
        transparent: true,
        opacity: 0.65,
      })
    : new THREE.MeshStandardMaterial({
        color: "#141b24",
        metalness: 0.2,
        roughness: 0.3,
      });
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.42, 1.5), cabinMat);
  cabin.position.set(0, 0.95, -0.05);
  car.add(cabin);

  for (const x of [-0.85, 0.85]) {
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.2), bodyMat);
    mirror.position.set(x, 0.85, -0.55);
    car.add(mirror);
  }

  const spoilerMat = new THREE.MeshStandardMaterial({ color: "#1c1f24", roughness: 0.5, metalness: 0.3 });
  for (const x of [-0.55, 0.55]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.08), spoilerMat);
    pillar.position.set(x, 0.85, 1.55);
    car.add(pillar);
  }
  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.32), spoilerMat);
  wing.position.set(0, 1.05, 1.55);
  car.add(wing);

  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.32, 16);
  const wheelMat = new THREE.MeshStandardMaterial({
    color: "#15161a",
    roughness: 0.9,
    metalness: 0.1,
  });
  const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.06, 12);
  const hubMat = new THREE.MeshStandardMaterial({
    color: "#d8dce1",
    roughness: 0.3,
    metalness: 0.8,
  });
  const wheelPositions: [number, number][] = [
    [-0.86, 1.05],
    [0.86, 1.05],
    [-0.86, -1.05],
    [0.86, -1.05],
  ];
  for (const [x, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.36, z);
    car.add(wheel);
    wheels.push(wheel);

    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(x + (x > 0 ? 0.14 : -0.14), 0.36, z);
    car.add(hub);
  }

  const lightMat = new THREE.MeshStandardMaterial({
    color: "#fff6d0",
    emissive: "#fff6d0",
    emissiveIntensity: 1.8,
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: "#ff2b2b",
    emissive: "#ff2b2b",
    emissiveIntensity: 1.2,
  });
  for (const x of [-0.55, 0.55]) {
    const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), lightMat);
    headlight.position.set(x, 0.5, -1.85);
    car.add(headlight);

    const taillight = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.06), tailMat);
    taillight.position.set(x, 0.6, 1.62);
    car.add(taillight);
  }

  car.userData.wheels = wheels;
  return car;
}

function buildTree(
  variant: number,
  trunkGeo: THREE.CylinderGeometry,
  trunkMat: THREE.Material,
  foliageGeo: THREE.ConeGeometry,
  foliageMats: THREE.Material[]
) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.55;
  tree.add(trunk);

  const foliage = new THREE.Mesh(foliageGeo, foliageMats[variant % 2]);
  foliage.position.y = 1.7;
  tree.add(foliage);

  return tree;
}

function buildCone(
  coneGeo: THREE.ConeGeometry,
  coneMat: THREE.Material,
  stripeGeo: THREE.CylinderGeometry,
  stripeMat: THREE.Material,
  baseGeo: THREE.BoxGeometry
) {
  const group = new THREE.Group();
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.y = 0.375;
  cone.castShadow = true;
  group.add(cone);

  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.y = 0.45;
  group.add(stripe);

  const base = new THREE.Mesh(baseGeo, coneMat);
  base.position.y = 0.04;
  group.add(base);

  return group;
}

function makeCurveOffset(amplitude: number, wavelength: number) {
  return (z: number) => Math.sin((-z / wavelength) * Math.PI * 2) * amplitude;
}

function buildCurvedRoadGeometry(
  topZ: number,
  bottomZ: number,
  halfWidth: number,
  curveFn: (z: number) => number,
  vRepeatPerUnit: number
) {
  const totalLength = topZ - bottomZ;
  const segments = Math.max(4, Math.round(totalLength / 4));
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = topZ - t * totalLength;
    const cx = curveFn(z);
    const v = t * totalLength * vRepeatPerUnit;
    positions.push(cx - halfWidth, 0, z, cx + halfWidth, 0, z);
    uvs.push(0, v, 1, v);
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, b, c, b, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildBoostTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = "#7df9ff";
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const offset of [6, 42, 78]) {
    ctx.beginPath();
    ctx.moveTo(18, offset);
    ctx.lineTo(64, offset + 32);
    ctx.lineTo(110, offset);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}

function buildStarfield(spread: number, centerZ: number) {
  const count = 160;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = 20 + Math.random() * 50;
    positions[i * 3 + 2] = centerZ + (Math.random() - 0.5) * spread;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: "#ffffff", size: 0.7, sizeAttenuation: true });
  return new THREE.Points(geo, mat);
}

const ORDINALS: Record<number, string> = {
  1: "1er",
  2: "2do",
  3: "3er",
  4: "4to",
  5: "5to",
  6: "6to",
  7: "7mo",
};

function ordinal(n: number) {
  return ORDINALS[n] ?? `${n}°`;
}

export default function RaceScene({
  world,
  level,
  onScoreChange,
  onPositionChange,
  onFinish,
}: {
  world: World;
  level: LevelTheme;
  onScoreChange: (score: number) => void;
  onPositionChange: (label: string) => void;
  onFinish: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const boostFlashRef = useRef<HTMLDivElement>(null);
  const targetXRef = useRef(0);
  const engineSoundRef = useRef<ReturnType<typeof createEngineSound> | null>(null);
  const raceStartedRef = useRef(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    targetXRef.current = 0;
    raceStartedRef.current = false;
    setCountdown(3);
    const TRACK_LENGTH = level.trackLength;
    const SPEED = level.speed;
    const STAR_COUNT = Math.round(TRACK_LENGTH / 17);
    const TREE_COUNT = Math.round(TRACK_LENGTH / 11);
    const curveOffset = makeCurveOffset(level.curveAmplitude, level.curveWavelength);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(level.sky);
    scene.fog = new THREE.Fog(level.fogColor, 30, 170);

    const camera = new THREE.PerspectiveCamera(
      58,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    );
    camera.position.set(0, 4.4, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(level.hemiSky, level.hemiGround, 1.0);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(level.sunColor, level.night ? 0.9 : 1.4);
    sun.position.set(10, 18, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(512, 512);
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    sun.shadow.camera.far = 40;
    sun.shadow.bias = -0.002;
    scene.add(sun);
    scene.add(sun.target);

    if (level.night) {
      scene.add(buildStarfield(TRACK_LENGTH + 100, -TRACK_LENGTH / 2));
    }

    const textureLoader = new THREE.TextureLoader();
    const roadTex = textureLoader.load("/textures/asphalt.jpg");
    roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
    roadTex.colorSpace = THREE.SRGBColorSpace;

    const grassTex = textureLoader.load("/textures/grass.jpg");
    grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
    grassTex.colorSpace = THREE.SRGBColorSpace;

    const roadTopZ = 50;
    const roadBottomZ = -(TRACK_LENGTH + 10);
    const roadCenterZ = (roadTopZ + roadBottomZ) / 2;
    const roadLength = roadTopZ - roadBottomZ;
    grassTex.repeat.set(45, Math.round(roadLength / 7));

    const road = new THREE.Mesh(
      buildCurvedRoadGeometry(roadTopZ, roadBottomZ, 3.7, curveOffset, 1 / 7),
      new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.95, color: level.roadTint })
    );
    road.receiveShadow = true;
    scene.add(road);

    const grass = new THREE.Mesh(
      new THREE.PlaneGeometry(90, roadLength),
      new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1, color: level.grassTint })
    );
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(0, -0.01, roadCenterZ);
    grass.receiveShadow = true;
    scene.add(grass);

    const treeGroup = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.14, 0.2, 1.1, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: "#6b4a2f", roughness: 1 });
    const foliageGeo = new THREE.ConeGeometry(0.85, 1.9, 7);
    const foliageMats = [
      new THREE.MeshStandardMaterial({ color: level.foliageColors[0], roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: level.foliageColors[1], roughness: 0.9 }),
    ];
    for (let i = 0; i < TREE_COUNT; i++) {
      const tree = buildTree(i, trunkGeo, trunkMat, foliageGeo, foliageMats);
      const side = i % 2 === 0 ? -1 : 1;
      const z = -10 - (i / TREE_COUNT) * (TRACK_LENGTH + 30) + (Math.random() * 4 - 2);
      const x = curveOffset(z) + side * (4.6 + Math.random() * 4);
      tree.position.set(x, 0, z);
      tree.scale.setScalar(0.8 + Math.random() * 0.6);
      treeGroup.add(tree);
    }
    scene.add(treeGroup);

    const starGeo = buildStarGeometry();
    const starMat = new THREE.MeshStandardMaterial({
      color: "#ffd54a",
      emissive: "#ffb300",
      emissiveIntensity: 0.6,
      metalness: 0.7,
      roughness: 0.25,
    });
    const stars: { mesh: THREE.Mesh; lane: number; z: number; collected: boolean }[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const lane = Math.floor(Math.random() * 3);
      const z = -18 - i * (TRACK_LENGTH / STAR_COUNT) + (Math.random() * 3 - 1.5);
      const mesh = new THREE.Mesh(starGeo, starMat);
      mesh.position.set(curveOffset(z) + LANES[lane], 1.1, z);
      mesh.rotation.x = Math.PI / 2;
      scene.add(mesh);
      stars.push({ mesh, lane, z, collected: false });
    }

    const OBSTACLE_COUNT = Math.max(6, Math.round(TRACK_LENGTH / 90));
    const coneGeo = new THREE.ConeGeometry(0.32, 0.75, 10);
    const coneMat = new THREE.MeshStandardMaterial({ color: "#ff7a1a", roughness: 0.6 });
    const stripeGeo = new THREE.CylinderGeometry(0.26, 0.29, 0.12, 10);
    const stripeMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6 });
    const baseGeo = new THREE.BoxGeometry(0.5, 0.08, 0.5);
    const obstacles: { mesh: THREE.Group; lane: number; z: number; hit: boolean }[] = [];
    for (let i = 0; i < OBSTACLE_COUNT; i++) {
      const lane = Math.floor(Math.random() * 3);
      const z = -30 - i * (TRACK_LENGTH / OBSTACLE_COUNT) + (Math.random() * 6 - 3);
      const mesh = buildCone(coneGeo, coneMat, stripeGeo, stripeMat, baseGeo);
      mesh.position.set(curveOffset(z) + LANES[lane], 0, z);
      scene.add(mesh);
      obstacles.push({ mesh, lane, z, hit: false });
    }

    const BOOST_COUNT = 3;
    const boostTex = buildBoostTexture();
    const boostMat = new THREE.MeshStandardMaterial({
      map: boostTex,
      transparent: true,
      emissive: "#00e5ff",
      emissiveMap: boostTex,
      emissiveIntensity: 1.4,
      roughness: 0.4,
      side: THREE.DoubleSide,
    });
    const boostGeo = new THREE.PlaneGeometry(2.2, 3.2);
    const boosts: { mesh: THREE.Mesh; lane: number; z: number; used: boolean }[] = [];
    for (let i = 0; i < BOOST_COUNT; i++) {
      const lane = Math.floor(Math.random() * 3);
      const z = -TRACK_LENGTH * ((i + 1) / (BOOST_COUNT + 1));
      const mesh = new THREE.Mesh(boostGeo, boostMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(curveOffset(z) + LANES[lane], 0.03, z);
      scene.add(mesh);
      boosts.push({ mesh, lane, z, used: false });
    }

    const finishX = curveOffset(-TRACK_LENGTH);
    const gatePoleMat = new THREE.MeshStandardMaterial({ color: "#e5e7eb" });
    for (const x of [-3.6, 3.6]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 5, 10), gatePoleMat);
      pole.position.set(finishX + x, 2.5, -TRACK_LENGTH);
      scene.add(pole);
    }
    const checkerCanvas = document.createElement("canvas");
    checkerCanvas.width = 64;
    checkerCanvas.height = 16;
    const cctx = checkerCanvas.getContext("2d")!;
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 2; y++) {
        cctx.fillStyle = (x + y) % 2 === 0 ? "#111" : "#fff";
        cctx.fillRect(x * 8, y * 8, 8, 8);
      }
    }
    const checkerTex = new THREE.CanvasTexture(checkerCanvas);
    checkerTex.wrapS = checkerTex.wrapT = THREE.RepeatWrapping;
    checkerTex.repeat.set(6, 1);
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(7.6, 1),
      new THREE.MeshStandardMaterial({ map: checkerTex })
    );
    banner.position.set(finishX, 4.6, -TRACK_LENGTH);
    scene.add(banner);

    const car = buildCar(world.accent, true);
    scene.add(car);

    const rivals = RIVAL_CONFIGS.map((r) => {
      const mesh = buildCar(r.color, false);
      mesh.position.set(curveOffset(r.startZ) + LANES[r.lane], 0, r.startZ);
      scene.add(mesh);
      return {
        mesh,
        lane: r.lane,
        baseSpeed: SPEED * r.speedFactor,
        wasBlocking: false,
        slowTimer: 0,
        boostTimer: 0,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleFreq: 0.15 + Math.random() * 0.25,
      };
    });

    const engineSound = createEngineSound(SPEED);
    engineSoundRef.current = engineSound;
    engineSound.start();
    engineSound.setMuted(!isSpeechEnabled());
    const muteCheckId = setInterval(() => {
      engineSound.setMuted(!isSpeechEnabled());
    }, 500);

    let shakeTime = 0;
    let flashIntensity = 0;
    let playerSlowTimer = 0;
    let playerBoostTimer = 0;
    let boostFlash = 0;
    let fovBoostAmount = 0;
    let steerX = 0;

    const clock = new THREE.Clock();
    let finished = false;
    let score = 0;
    let lastPositionLabel = "";
    let frameId = 0;

    const countdownTimers: number[] = [];
    countdownTimers.push(window.setTimeout(() => setCountdown(2), 800));
    countdownTimers.push(window.setTimeout(() => setCountdown(1), 1600));
    countdownTimers.push(window.setTimeout(() => setCountdown(0), 2400));
    countdownTimers.push(
      window.setTimeout(() => {
        setCountdown(null);
        raceStartedRef.current = true;
      }, 3100)
    );

    function handleResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener("resize", handleResize);

    function onKeyDown(e: KeyboardEvent) {
      engineSound.start();
      if (e.key === "ArrowLeft")
        targetXRef.current = Math.max(-MAX_X, targetXRef.current - LANE_STEP);
      if (e.key === "ArrowRight")
        targetXRef.current = Math.min(MAX_X, targetXRef.current + LANE_STEP);
    }
    window.addEventListener("keydown", onKeyDown);

    let dragging = false;
    let dragStartClientX = 0;
    let dragStartTargetX = 0;

    function onPointerDown(e: PointerEvent) {
      engineSound.start();
      dragging = true;
      dragStartClientX = e.clientX;
      dragStartTargetX = targetXRef.current;
    }
    function onPointerMove(e: PointerEvent) {
      if (!dragging) return;
      const delta = e.clientX - dragStartClientX;
      targetXRef.current = Math.min(
        MAX_X,
        Math.max(-MAX_X, dragStartTargetX + delta * DRAG_SENSITIVITY)
      );
    }
    function onPointerUp() {
      dragging = false;
    }
    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    function spinWheels(group: THREE.Group, speed: number, delta: number) {
      const wheels = group.userData.wheels as THREE.Mesh[] | undefined;
      if (!wheels) return;
      for (const wheel of wheels) wheel.rotation.x += delta * speed * 2.2;
    }

    function updateFrame(delta: number) {
      if (!raceStartedRef.current) {
        camera.position.x += (car.position.x * 0.7 - camera.position.x) * Math.min(1, delta * 4);
        camera.position.z = car.position.z + 8;
        camera.position.y = 4.4;
        camera.lookAt(car.position.x * 0.5, 1.1, car.position.z - 12);
        return;
      }

      if (playerSlowTimer > 0) playerSlowTimer = Math.max(0, playerSlowTimer - delta);
      if (playerBoostTimer > 0) playerBoostTimer = Math.max(0, playerBoostTimer - delta);
      const playerSpeedFactor = playerBoostTimer > 0 ? 1.6 : playerSlowTimer > 0 ? 0.45 : 1;

      if (!finished) {
        car.position.z -= SPEED * playerSpeedFactor * delta;
      }
      spinWheels(car, SPEED * playerSpeedFactor, delta);

      for (const rival of rivals) {
        if (rival.slowTimer > 0) rival.slowTimer = Math.max(0, rival.slowTimer - delta);
        if (rival.boostTimer > 0) rival.boostTimer = Math.max(0, rival.boostTimer - delta);
        const wobble = 1 + Math.sin(clock.elapsedTime * rival.wobbleFreq + rival.wobblePhase) * 0.06;
        const speedState = rival.boostTimer > 0 ? 1.6 : rival.slowTimer > 0 ? 0.45 : 1;
        const effSpeed = rival.baseSpeed * wobble * speedState;
        if (rival.mesh.position.z > -TRACK_LENGTH) {
          rival.mesh.position.z = Math.max(
            rival.mesh.position.z - effSpeed * delta,
            -TRACK_LENGTH
          );
          rival.mesh.position.x = curveOffset(rival.mesh.position.z) + LANES[rival.lane];
          spinWheels(rival.mesh, effSpeed, delta);
        }
      }

      for (const obstacle of obstacles) {
        if (obstacle.hit) continue;
        const dz = Math.abs(obstacle.z - car.position.z);
        const dxo = Math.abs(obstacle.mesh.position.x - car.position.x);
        if (dz < 1.3 && dxo < 1.0) {
          obstacle.hit = true;
          obstacle.mesh.rotation.z = Math.PI / 2.2;
          obstacle.mesh.position.y = -0.05;
          playerSlowTimer = 0.6;
          playerBoostTimer = 0;
          engineSound.bump();
          shakeTime = 0.2;
          flashIntensity = 0.35;
          continue;
        }
        for (const rival of rivals) {
          const rdz = Math.abs(obstacle.z - rival.mesh.position.z);
          const rdx = Math.abs(obstacle.mesh.position.x - rival.mesh.position.x);
          if (rdz < 1.3 && rdx < 1.0) {
            obstacle.hit = true;
            obstacle.mesh.rotation.z = Math.PI / 2.2;
            obstacle.mesh.position.y = -0.05;
            rival.slowTimer = 0.7 + Math.random() * 0.4;
            rival.boostTimer = 0;
            break;
          }
        }
      }

      for (const boost of boosts) {
        if (boost.used) continue;
        const pulse = 1 + Math.sin(clock.elapsedTime * 5 + boost.z) * 0.08;
        boost.mesh.scale.set(pulse, pulse, 1);

        const dz = Math.abs(boost.z - car.position.z);
        const dxb = Math.abs(boost.mesh.position.x - car.position.x);
        if (dz < 1.4 && dxb < 1.1) {
          boost.used = true;
          boost.mesh.visible = false;
          playerBoostTimer = 1.5;
          playerSlowTimer = 0;
          boostFlash = 0.35;
          engineSound.collect();
          continue;
        }
        for (const rival of rivals) {
          const rdz = Math.abs(boost.z - rival.mesh.position.z);
          const rdxb = Math.abs(boost.mesh.position.x - rival.mesh.position.x);
          if (rdz < 1.4 && rdxb < 1.1) {
            boost.used = true;
            boost.mesh.visible = false;
            rival.boostTimer = 1.5;
            rival.slowTimer = 0;
            break;
          }
        }
      }

      const dx = targetXRef.current - steerX;
      steerX += dx * Math.min(1, delta * 7);
      car.position.x = curveOffset(car.position.z) + steerX;
      car.rotation.z = THREE.MathUtils.clamp(-dx * 0.25, -0.35, 0.35);
      car.rotation.y = THREE.MathUtils.clamp(-dx * 0.12, -0.2, 0.2);

      let isBlocked = false;
      for (const rival of rivals) {
        const rivalDx = Math.abs(car.position.x - rival.mesh.position.x);
        const rivalAhead = rival.mesh.position.z < car.position.z;
        if (rivalDx < COLLISION_X && rivalAhead) {
          const minZ = rival.mesh.position.z + CAR_GAP;
          if (car.position.z < minZ) {
            car.position.z = minZ;
            isBlocked = true;
            if (!rival.wasBlocking) {
              rival.wasBlocking = true;
              engineSound.bump();
              shakeTime = 0.15;
              flashIntensity = 0.3;
            }
            continue;
          }
        }
        rival.wasBlocking = false;
      }
      engineSound.setBlocked(isBlocked);

      for (const star of stars) {
        if (star.collected) continue;
        star.mesh.rotation.y += delta * 2.2;
        star.mesh.position.y = 1.1 + Math.sin(clock.elapsedTime * 3 + star.z) * 0.12;
        const dz = Math.abs(star.z - car.position.z);
        const dxs = Math.abs(star.mesh.position.x - car.position.x);
        if (dz < 1.3 && dxs < 1.0) {
          star.collected = true;
          star.mesh.visible = false;
          score += 1;
          onScoreChange(score);
          engineSound.collect();
        }
      }

      const standings = [car.position.z, ...rivals.map((r) => r.mesh.position.z)];
      const rank = 1 + standings.filter((z) => z < car.position.z).length;
      const label = `${ordinal(rank)} lugar`;
      if (label !== lastPositionLabel) {
        lastPositionLabel = label;
        onPositionChange(label);
      }

      camera.position.x += (car.position.x * 0.7 - camera.position.x) * Math.min(1, delta * 4);
      camera.position.z = car.position.z + 8;
      camera.position.y = 4.4;
      if (shakeTime > 0) {
        shakeTime = Math.max(0, shakeTime - delta);
        camera.position.x += (Math.random() - 0.5) * 0.25;
        camera.position.y += (Math.random() - 0.5) * 0.15;
      }
      camera.lookAt(car.position.x * 0.5, 1.1, car.position.z - 12);
      sun.target.position.set(car.position.x, 0, car.position.z);

      const targetFovBoost = playerBoostTimer > 0 ? 1 : 0;
      fovBoostAmount += (targetFovBoost - fovBoostAmount) * Math.min(1, delta * 6);
      const targetFov = 58 + fovBoostAmount * 9;
      if (Math.abs(camera.fov - targetFov) > 0.05) {
        camera.fov += (targetFov - camera.fov) * Math.min(1, delta * 6);
        camera.updateProjectionMatrix();
      }

      if (flashRef.current) {
        flashIntensity = Math.max(0, flashIntensity - delta * 1.5);
        flashRef.current.style.opacity = String(flashIntensity);
      }
      if (boostFlashRef.current) {
        boostFlash = Math.max(0, boostFlash - delta * 1.2);
        boostFlashRef.current.style.opacity = String(boostFlash);
      }

      if (progressRef.current) {
        const pct = Math.min(100, Math.max(0, (-car.position.z / TRACK_LENGTH) * 100));
        progressRef.current.style.width = `${pct}%`;
      }

      if (!finished && car.position.z <= -TRACK_LENGTH) {
        finished = true;
        engineSound.finish();
        onFinish();
      }
    }

    function animate() {
      frameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      updateFrame(delta);
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      clearInterval(muteCheckId);
      countdownTimers.forEach((id) => clearTimeout(id));
      engineSound.stop();
      engineSoundRef.current = null;
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", onKeyDown);
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      container.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) {
            const map = (m as THREE.MeshStandardMaterial).map;
            if (map) map.dispose();
            m.dispose();
          }
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  return (
    <>
      <div ref={mountRef} className="absolute inset-0 touch-none" />

      <div
        ref={flashRef}
        className="pointer-events-none absolute inset-0 z-20 bg-red-500"
        style={{ opacity: 0 }}
      />

      <div
        ref={boostFlashRef}
        className="pointer-events-none absolute inset-0 z-20 bg-cyan-300"
        style={{ opacity: 0 }}
      />

      {countdown !== null && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <span
            key={countdown}
            className="animate-pop-in text-9xl font-black text-white"
            style={{ textShadow: "0 6px 0 rgba(0,0,0,0.3)" }}
          >
            {countdown === 0 ? "¡Ya!" : countdown}
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-20 z-10 px-6">
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/40">
          <div
            ref={progressRef}
            className="h-full rounded-full bg-yellow-400 transition-[width]"
            style={{ width: "0%" }}
          />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center gap-10 p-6">
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            engineSoundRef.current?.start();
            targetXRef.current = Math.max(-MAX_X, targetXRef.current - LANE_STEP);
          }}
          className="pointer-events-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-4xl shadow-xl active:scale-90"
          aria-label="Izquierda"
        >
          ⬅️
        </button>
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            engineSoundRef.current?.start();
            targetXRef.current = Math.min(MAX_X, targetXRef.current + LANE_STEP);
          }}
          className="pointer-events-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-4xl shadow-xl active:scale-90"
          aria-label="Derecha"
        >
          ➡️
        </button>
      </div>
    </>
  );
}
