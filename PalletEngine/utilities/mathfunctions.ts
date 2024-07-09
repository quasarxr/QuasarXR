
export default class MathFunctions {

    deg2Rad( degree : number ) { return degree * Math.PI / 180.0; }
    rad2Deg( radian : number ) { return radian * 180.0 / Math.PI; }
    clamp( value : number, lower : number, upper : number ) { return Math.max( Math.min( value, upper ), lower ); }

    snapDeg() {

    }

    normalizeDegree( degree : number ) {

    }

    normalizeRadian( radian : number ) {

    }

    dec2Hex( dec : number ) {

    }

    hex2Deg( hex : string ) {
        
    }

    randomHexColor() {
        const randomColor = Math.floor(Math.random() * 16777215 ).toString(16);
        return `#${randomColor}`;
    }
}