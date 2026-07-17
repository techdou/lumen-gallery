// 对照实验：原始场景 vs SkeletonUtils.clone，不同 update 时间，谁让角色变成躺平巨人
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { readFileSync } from 'node:fs';

const path = process.argv[2];
const buf = readFileSync(path);
const loader = new GLTFLoader();
const gltf = await new Promise((res, rej) =>
  loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej),
);

const idle = gltf.animations.find((a) => a.name.endsWith('|Idle'));

function measure(root, label) {
  root.updateMatrixWorld(true);
  const real = new THREE.Box3();
  root.traverse((o) => {
    if (!o.isSkinnedMesh) return;
    o.computeBoundingBox();
    real.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld));
  });
  const s = real.getSize(new THREE.Vector3());
  console.log(label.padEnd(34), s.toArray().map((v) => v.toFixed(2)), 'min.y=', real.min.y.toFixed(2));
}

// A. 原始场景，不播动画
measure(gltf.scene, 'A original, no anim');

// B. 原始场景，Idle update(0)
{
  const mixer = new THREE.AnimationMixer(gltf.scene);
  mixer.clipAction(idle).play();
  mixer.update(0);
  measure(gltf.scene, 'B original, idle update(0)');
  mixer.update(0.5);
  measure(gltf.scene, 'C original, idle update(0.5)');
  mixer.stopAllAction();
}

// D. clone，不播动画
const cloned = skeletonClone(gltf.scene);
measure(cloned, 'D clone, no anim');

// E. clone + Idle
{
  const mixer = new THREE.AnimationMixer(cloned);
  mixer.clipAction(idle).play();
  mixer.update(0);
  measure(cloned, 'E clone, idle update(0)');
  mixer.update(0.5);
  measure(cloned, 'F clone, idle update(0.5)');
}
