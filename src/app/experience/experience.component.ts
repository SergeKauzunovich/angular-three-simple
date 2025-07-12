import { NgtStats } from '@angular-three/core/stats';
import { DOCUMENT } from '@angular/common';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { getLocalState, injectBeforeRender, injectObjectEvents } from 'angular-three';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { Mesh } from 'three';

import { Object3dComponent } from './object3d/object3d.component';
import { Path3 } from './services/animation.service';

@Directive({
  selector: '[cursorPointer]',
  standalone: true,
})
export class CursorPointerDirective {
  constructor() {
    const document = inject(DOCUMENT);
    const hostElement = inject<ElementRef<Mesh>>(ElementRef);
    const mesh = hostElement.nativeElement;

    const localState = getLocalState(mesh);
    if (!localState) return;

    injectObjectEvents(() => mesh, {
      pointerover: () => void (document.body.style.cursor = 'pointer'),
      pointerout: () => void (document.body.style.cursor = 'default'),
    });
  }
}

@Component({
  templateUrl: './experience.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgtsOrbitControls, NgtsPerspectiveCamera, Object3dComponent, NgtStats],
})
export class ExperienceComponent {
  private camera = viewChild.required<NgtsPerspectiveCamera>('camera');
  airplaneFlightPath: Path3 = {
    points: [
      { forward: -200, time: 2 },
      { forward: -200, up: 35, roll: -10, time: 2 },
      { forward: -250, up: 50, roll: -10, time: 2 },
      { right: 300, roll: 20, up: 50, yaw: -90, time: 3 },
      { right: 300, yaw: -90, up: 50, time: 3 },
      { forward: 1500, time: 12 },
      { right: -300, roll: -5, up: -50, yaw: -90, time: 5 },
      { right: -300, yaw: -90, up: -50, time: 5 },
      { forward: -250, time: 3, roll: 5, up: -75 },
      { forward: -200, time: 3, roll: 5, up: -10 },
      { forward: -200, time: 3, up: -5 },
    ],
    loop: true,
  };

  constructor() {
    injectBeforeRender(({ delta }) => {
      // This happens on each frame redraw of the scene.
      const fps = Math.round(1 / delta);
      if (fps < 30) console.warn('FPS warning at', fps);
    });
  }
}
