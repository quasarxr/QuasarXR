import { Object3D } from 'three';
import TWEEN from 'three/examples/jsm/libs/tween.module';

interface Vector3 {
    x : number | undefined;
    y : number | undefined;
    z : number | undefined;
}

interface TweenParam { 
    object : Object3D;
    type : string;
    from : Vector3;
    to : Vector3;
    duration : number;
    easing : Function;
}

let _tweenID = 0;
function generateTweenID() {
    return _tweenID++;
}

export class TweenElement {
    private readonly _id : number;
    private _tween : TWEEN.Tween;
    private _enabled : boolean;
    constructor( tween ) {
        this._id = generateTweenID();
        this._tween = tween;
        this._enabled = true;
    }
    start() {
        // ... all children start tween
        this._tween.start();
        return this;
    }

    complete( callback ) {
        this._tween.onComplete( callback );
        return this;
    }

    chain( args : TWEEN.Tween ) {
        this._tween.chain( ...args );
        return this;
    }
    get instance() {
        return this._tween;
    }
    get id() {
        return this._id;
    }

    get duration() {
        return this._tween.getDuration();
    }

    set duration( d ) {
        this._tween.duration( d );
    }

    get object() {
        return this._tween._object;
    }

    get valuesStart() {
        return this._tween._valuesStart;
    }

    get enabeld() {
        return this._enabled;
    }

    set enabled( value ) {
        this._enabled = value;
    }
}

export class TweenSequence {

}

export class TweenManager {
    private data : Map< Object3D, [ TweenElement ] >;

    constructor() {
        this.data = new Map< Object3D, [ TweenElement ] >();
    }

    add( param : TweenParam ) {
        const tween = new TweenElement(  new TWEEN.Tween( param.object[ param.type ] ).to( param.to, param.duration * 1000 )
            .easing( TWEEN.Easing.Quadratic.Out ) );
        
        if ( this.data.has( param.object ) ) {
            this.data.get( param.object ).push( tween );
        } else {
            this.data.set( param.object, [ tween ] );
        }
        console.log( this.data.get( param.object ) );
        return this.data.get( param.object );
    }

    makeSequence( object : Object3D ) {
        const elements = this.data.get( object );        
        if ( elements ) {
            elements.map( ( tween, index, arr ) => {
                console.log( tween.valuesStart );
                if ( index < arr.length - 1 ) {
                    tween.chain( [ arr[ index + 1 ] ] );
                }
            } );
            return elements;
        } else {
            console.error( 'tween element not exist' );
            return null;
        }
    }

    preview( object : Object3D ) {
        const array = this.makeSequence( object );
        const buffer = {
            position : object.position.clone(),
            rotation : object.rotation.clone(),
            scale : object.scale.clone()
        };
        if ( array ) {            
            array.at(0).start();
            array.at(-1).complete( () => {
                object.position.copy( buffer.position );
                object.rotation.copy( buffer.rotation );
                object.scale.copy( buffer.scale );
            } );
        }        
    }

    play( object : Object3D ) { // only object or all
        if ( object ) {
            const array = this.makeSequence( object );
            array[0].start();
        } else {
            // play all
        }
    }

    elements( object : Object3D ) {
        if ( object ) {
            
        }
    }

    update() {
        TWEEN.update();
    }

    get tweenData() {
        return this.data;
    }
}