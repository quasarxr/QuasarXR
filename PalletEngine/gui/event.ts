export default class EventEmitter {
    static events = new Map<string, Function[]>();

    // add listener
    static on( event : string, listener : Function ) {
        if ( ! EventEmitter.get( event ) ) {
            EventEmitter.assign( event, [ listener ] );
        } else {
            EventEmitter.set( event, listener );
        }
    }

    // remove listener
    static off( event, listener ) {
        if ( ! EventEmitter.get( event ) ) return;
        const newArray = EventEmitter.get( event ).filter( l => l !== listener );
        EventEmitter.assign( event, newArray );
    }
    
    static emit( event, data ) {
        if ( ! EventEmitter.get( event ) ) return;
        EventEmitter.get( event ).forEach( listener => listener( data ) );
    }
    
    private static get( event : string ) {
        return EventEmitter.events.get( event );
    }

    private static set( event : string, listener : Function ) {
        const index = EventEmitter.get( event ).push( listener ) - 1;
        return index;
    }

    private static assign( event : string , listeners : Function[] ) {
        EventEmitter.events.set( event, listeners );
    }
}