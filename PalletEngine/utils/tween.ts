import { Object3D } from 'three';
import TWEEN from 'three/examples/jsm/libs/tween.module';

interface Vector3 {
    x : number | undefined;
    y : number | undefined;
    z : number | undefined;
}

interface TweenAddParam { 
    object : Object3D;
    name : string | undefined;
    type : string;
    from : Vector3;
    to : Vector3;
    duration : number;
    easing : Function;
}

interface TweenUpdateParam {
    object : Object3D;
    name : string;
    type : string;
    duration : number;
    to : Vector3;
}

interface TweenRemoveParam {
    object : Object3D;
    index : number;
}

let _tweenID = 0;
function generateTweenID() {
    return _tweenID++;
}

export class TweenElement {
    private readonly _id : number;
    private _type : string;
    private _name : string;
    private _tween : TWEEN.Tween;
    private _enabled : boolean;
    constructor( tween : TWEEN.Tween, name : string = undefined, type : string = undefined ) {
        this._id = generateTweenID();
        if ( name === '' || name === undefined || name === null || /tween-\d/.exec( name ) ) {
            this._name = `tween-${this._id}`;
        } else {
            this._name = name;
        }
        this._tween = tween;
        this._enabled = true;
        this._type = type;
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

    get type() {
        return this._type;
    }

    set type( value ) {
        this._type = value;
    }

    get name() {
        return this._name;
    }

    set name( value ) {
        this._name = value;
    }

    get duration() {
        return this._tween.getDuration();
    }

    set duration( value ) {
        this._tween.duration( value );
    }

    get object() {
        return this._tween._object;
    }

    get valuesStart() {
        return this._tween._valuesStart;
    }

    set valuesStart( value ) {
        this._tween._valuesStart = value;
    }
    
    get valuesEnd() {
        return this._tween._valuesEnd;
    }

    set valuesEnd( value ) {
        this._tween._valuesEnd = value;
    }

    get enabeld() {
        return this._enabled;
    }

    set enabled( value ) {
        this._enabled = value;
    }

    updateData( payload : TweenUpdateParam ) {
        console.log( payload );
        this._name = payload.name;
        this._type = payload.type;
        this._tween._object = payload.object[ payload.type ];
        this._tween.to( payload.to, payload.duration * 1000 );
        console.log( this );
    }
}

export class TweenSequence {

}

export class TweenManager {
    private data : Map< Object3D, TweenElement[] >;

    constructor() {
        this.data = new Map< Object3D, TweenElement[] >();
    }

    add( param : TweenAddParam ) {
        const tween = new TweenElement(  new TWEEN.Tween( param.object[ param.type ] ).to( param.to, param.duration * 1000 )
            .easing( TWEEN.Easing.Quadratic.Out ), param.name, param.type );
        return this.data.set( param.object, [ ...this.data.get( param.object ) || [], tween ] as TweenElement[] );
    }

    remove( param : TweenRemoveParam ) {
        const data = this.getData( param.object );
        if ( param.index ) {
            data?.splice( param.index, 1 );
        }
    }

    getData( object : Object3D ) : TweenElement[] {
        let data = null;
        if ( this.data.has( object ) ) {
            data = this.data.get( object );
        }
        return data;
    }

    makeSequence( object : Object3D ) {
        const elements = this.data.get( object );        
        if ( elements ) {
            elements.map( ( tween, index, arr ) => {
                console.log( tween );
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
        const context = this.rollbackContext( object );

        if ( array ) {
            array.at(-1).complete( () => {
                //this.executeRollback( context, object );
            } );
            array.at(0).start();
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

    rollbackContext( object : Object3D ) {
        const context = {
            position : object.position.clone(),
            rotation : object.rotation.clone(),
            scale : object.scale.clone()
        };
        return context;
    }

    executeRollback( context, object : Object3D ) {
        object.position.copy( context.position );
        object.rotation.copy( context.rotation );
        object.scale.copy( context.scale );
    }

    elements( object : Object3D ) {
        console.log( this.data, object );
        return this.data.get( object );
    }

    update() {
        TWEEN.update();
    }

    reoderingData( target : Object3D, from : number, to : number ) {
        const element = this.data.get(target).splice(from, 1)[0];
        this.data.get(target).splice(to, 0, element);
        console.log( this.data.get( target ) );
    }

    get tweenData() {
        return this.data;
    }
}