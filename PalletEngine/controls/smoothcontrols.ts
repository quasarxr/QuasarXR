import * as THREE from 'three';
import { Spherical } from 'three/src/math/Spherical';
import Damper from './damper';

export default class SmoothControls extends THREE.EventDispatcher {
    constructor() {
        super();
    }
}