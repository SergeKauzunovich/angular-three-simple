import { Injectable } from '@angular/core';
import { Easing, Tween } from '@tweenjs/tween.js';
import { Mesh } from 'three';

export type Path3Point = {
  right?: number;
  up?: number;
  forward?: number;
  yaw?: number;
  roll?: number;
  pitch?: number;
  time?: number;
  easing?: (number: number) => number;
};
export type Path3 = { points: Array<Path3Point>; loop?: boolean };
export const derToRadCo = Math.PI / 180;

/**
 * @description
 * Animates an {@link Object3d} along {@link Path3}
 *
 * @param object - Object3d to move.
 * @param path3 - Path to move the object along.
 * @param speed - Speed of movement between path points.
 *
 */

@Injectable({
  providedIn: 'root',
})
export class AnimationService {
  animatePath(mesh: Mesh, path3: Path3): Tween[] {
    // Assemble tween chain.
    const _tweenChain: Tween[] = [];
    const _lastMeshPosition = { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z };
    const _lastMeshRotation = { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z };
    path3.points.forEach((point, index) => {
      const _isFirst = index === 0;
      const _isLast = index === path3.points.length - 1;
      const _tweenStartPosition = {
        x: _lastMeshPosition.x,
        y: _lastMeshPosition.y,
        z: _lastMeshPosition.z,
        rx: _lastMeshRotation.x,
        ry: _lastMeshRotation.y,
        rz: _lastMeshRotation.z,
      };
      _lastMeshPosition.x += point.right || 0;
      _lastMeshPosition.y += point.up || 0;
      _lastMeshPosition.z += (point.forward || 0) * -1;
      _lastMeshRotation.x += (point.roll || 0) * derToRadCo;
      _lastMeshRotation.y += (point.yaw || 0) * derToRadCo * -1;
      _lastMeshRotation.z += (point.pitch || 0) * derToRadCo;
      const _tweenTargetPosition = {
        x: _lastMeshPosition.x,
        y: _lastMeshPosition.y,
        z: _lastMeshPosition.z,
        rx: _lastMeshRotation.x,
        ry: _lastMeshRotation.y,
        rz: _lastMeshRotation.z,
      };
      _tweenChain.push(
        new Tween(_tweenStartPosition)
          .to(_tweenTargetPosition, (point.time || 0.3) * 1000)
          .easing(point.easing || Easing.Linear.None)
          .onUpdate((_obj) => {
            mesh.position.set(_obj.x, _obj.y, _obj.z);
            mesh.rotation.set(_obj.rx, _obj.ry, _obj.rz);
          }),
      );
    });
    _tweenChain.forEach((_tween, _index) => {
      if (_index < _tweenChain.length - 1) {
        _tween.chain(_tweenChain[_index + 1]);
      } else {
        // Loop
        _tweenChain[0].easing(Easing.Linear.None);
        if (path3.loop) _tween.chain(_tweenChain[0]);
      }
    });
    _tweenChain[0].start();

    return _tweenChain;
  }
}
