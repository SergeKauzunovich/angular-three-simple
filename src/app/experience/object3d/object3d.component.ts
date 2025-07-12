import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Tween } from '@tweenjs/tween.js';
import { NgtThreeEvent, getLocalState, injectBeforeRender, injectObjectEvents } from 'angular-three';
import { BufferGeometry, Mesh, MeshBasicMaterial, MeshStandardMaterial, Texture, TextureLoader } from 'three';
import { OBJLoader } from 'three-stdlib';
import { AnimationService, Path3, derToRadCo } from '../services/animation.service';

export type Object3dModel = {
  obj: string;
  map?: string;
};

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
  selector: 'app-ngt-object3d',
  templateUrl: './object3d.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CursorPointerDirective],
})
export class Object3dComponent implements AfterViewInit {
  private meshRef = viewChild.required<ElementRef<Mesh>>('mesh');

  model = input.required<Object3dModel[]>();
  rootUrl = input<string>();
  scale = input<number>(1);
  x = input<number>(0);
  y = input<number>(0);
  z = input<number>(0);
  rotX = input<number>(0);
  rotY = input<number>(0);
  rotZ = input<number>(0);
  mirror = input<'X' | 'Y' | 'Z' | 'XY' | 'XZ' | 'YZ' | 'XYZ' | undefined>(undefined);
  path = input<Path3 | undefined>(undefined);

  meshes = output<Mesh[]>();

  protected hovered = signal(false);

  meshGeometry = signal<BufferGeometry[] | undefined>(undefined);
  planeBasicMaterial = signal<MeshBasicMaterial[] | undefined>(undefined);
  tweenChain = signal<Tween[] | undefined>(undefined);

  #animationService = inject(AnimationService);

  #parent3d = computed(() => {
    return this.meshRef().nativeElement;
  });

  // eslint-disable-next-line no-unused-private-class-members
  #isMeshReady = effect(() => {
    if ((this.meshGeometry()?.length || 0) < this.model().length) {
      return false;
    }
    const totalNumberOfModelTextures = this.model()
      .map((_obj: Object3dModel) => (_obj.map ? 1 : 0) as number)
      .reduce((_previous, _current) => _previous + _current);
    console.log('total maps: ', totalNumberOfModelTextures);
    if ((this.planeBasicMaterial()?.length || 0) < totalNumberOfModelTextures) {
      return false;
    }

    const _basicMaterials = this.planeBasicMaterial() || [];
    this.meshGeometry()?.forEach((_meshGeometry, _index) => {
      const newMeshMaterial =
        _basicMaterials.find(
          (_material) =>
            _material.name ===
            this.model()?.find((_obj: Object3dModel) => _obj.obj === _meshGeometry.name)?.obj + '_map',
        ) || new MeshStandardMaterial();
      const newMesh = new Mesh(_meshGeometry, newMeshMaterial);
      newMesh.name = 'mesh__' + (this.rootUrl() || '') + this.model()[_index].obj;
      this.#parent3d().add(newMesh);
    });

    const _path = this.path();
    if (_path) {
      this.tweenChain.set(this.#animationService.animatePath(this.meshRef().nativeElement, _path));
    }

    this.meshRef().nativeElement.rotateX(this.rotX() * derToRadCo);
    this.meshRef().nativeElement.rotateY(this.rotY() * derToRadCo);
    this.meshRef().nativeElement.rotateZ(this.rotZ() * derToRadCo);
    this.meshRef().nativeElement.position.set(this.x(), this.y(), this.z());
    this.meshRef().nativeElement.scale.set(this.scale(), this.scale(), this.scale());

    return true;
  });

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    injectBeforeRender(({ delta }) => {
      this.tweenChain()?.forEach((_tween) => {
        _tween?.update();
      });
    });
  }

  ngAfterViewInit(): void {
    this.loadNewModel();
  }

  loadNewModel(): void {
    const _modelObj = this.model().map((_obj: Object3dModel) => _obj.obj) || [];
    _modelObj.forEach((_objUrl) => {
      const objLoader = new OBJLoader();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      objLoader.load('models/' + (this.rootUrl() || '') + _objUrl + '.obj', (_object: any) => {
        const _meshGeometry = _object.children[0].geometry;
        _meshGeometry.name = _objUrl;
        this.meshGeometry.set([...(this.meshGeometry() || []), _meshGeometry]);
        console.log('load ->', 'models/' + (this.rootUrl() || '') + _objUrl + '.obj');
      });
    });

    const _modelTexture =
      this.model().map((_obj: Object3dModel) => {
        return {
          mapTexture: _obj.map,
          objName: _obj.obj,
        };
      }) || [];
    _modelTexture.forEach((_texture) => {
      if (!this.planeBasicMaterial()?.find((_mat) => _mat.name === _texture.objName + '_map')) {
        const textureLoader = new TextureLoader();
        textureLoader.load(
          'models/' + (this.rootUrl() || '') + 'textures/' + _texture.mapTexture,
          (_object: Texture) => {
            const _meshTexture = _object;
            const _newMaterial = new MeshBasicMaterial({ map: _meshTexture, name: _texture.objName + '_map' });
            this.planeBasicMaterial.set([...(this.planeBasicMaterial() || []), _newMaterial]);
          },
        );
      }
    });
  }

  unloadModel() {
    this.meshGeometry.set(undefined);
    this.planeBasicMaterial.set(undefined);
    const _mesh = this.#parent3d();
    _mesh.children.forEach((_child) => {
      _mesh.remove(_child);
    });
  }

  onPlaneClick(event: NgtThreeEvent<MouseEvent>) {
    // eslint-disable-next-line no-console
    console.log('click', event.clientX, event.clientY);
  }
}
