import { Object3D, PerspectiveCamera } from 'three'
import { LineSegments } from 'three/src/objects/LineSegments';

class CameraHelper extends LineSegments {
    camera : PerspectiveCamera;
    constructor( camera : any ) {
        super();
    }
}


export { CameraHelper };