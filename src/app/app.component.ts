import { Component, signal } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { ExperienceComponent } from './experience/experience.component';

@Component({
  selector: 'app-root',
  template: `
    <div [style]="'position: absolute; width: 100%; height: 100%; top: 0; left: 0; z-index: 1'">
      <ngt-canvas [sceneGraph]="sceneGraph" (created)="onCreated($event)" />
    </div>
  `,
  host: { class: 'block h-dvh w-full' },
  imports: [NgtCanvas],
})
export class AppComponent {
  sceneGraph = ExperienceComponent;

  fpsString = signal<number | undefined>(undefined);

  onCreated(e: any) {
    console.warn('created', e);
  }
}
