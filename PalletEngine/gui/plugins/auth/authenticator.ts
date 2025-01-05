import {
    Blade,
    BaseBladeParams,
    ViewProps,
    View,
    BladePlugin,
    BladeController,
    parseRecord,
    createPlugin,
    BladeApi,
    ClassName,
    TpPluginBundle
} from '@tweakpane/core';

import EventEmitter from '../../event';

interface ControllerConfig {
    blade : Blade;
    viewProps : ViewProps;
}

const className =  ClassName('authenticator'); 

export class AuthenticatorBladeController extends BladeController<AuthenticatorView> {
    constructor( document: Document, params: ControllerConfig ) {
        super( {
            blade: params.blade,
            viewProps: params.viewProps,
            view: new AuthenticatorView( document, params.viewProps ),
        } );
    }

    public getSessions() {
        return [];
    }

    public setSession( session ) {
        this.view.setSession( session );
        console.log( 'setSession', session );
    }

    public setAuthenticator( authenticator ) {
        console.log( 'setAuthenticator', authenticator );
    }
}

export class AuthenticatorView implements View {
    element: HTMLElement;
    private nameTag : Text;
    private thumbnail : HTMLElement;
    private login : HTMLButtonElement;
    private logout : HTMLButtonElement;
    private session : any;

    constructor(document: Document, params: ViewProps) {
        this.element = document.createElement('div');
        this.element.classList.add( className() );
        this.element.appendChild(document.createTextNode('USER'));

        const root = document.createElement('div');
        root.classList.add( className('root') );
        this.element.appendChild( root );

        this.nameTag = document.createTextNode('anonymous');
        this.thumbnail = document.createElement('div');
        this.thumbnail.classList.add( className('thumbnail') );

        this.login = document.createElement('button');
        this.login.textContent = 'Login';
        this.login.style.display = this.session ? 'none' : '';
        this.login.style.marginLeft = '10px';
        this.login.classList.add( className('button') );
        this.login.addEventListener( 'click', () => {
            console.log('login');
            EventEmitter.emit( 'auth-login', undefined );
        } );
        this.logout = document.createElement('button');
        this.logout.textContent = 'Logout';
        this.logout.style.display = this.session ? '' : 'none';
        this.logout.style.marginLeft = '10px';
        this.logout.classList.add( className('button') );
        this.logout.addEventListener( 'click', () => {
            console.log('logout');
            EventEmitter.emit( 'auth-logout', undefined );
        } );

        root.appendChild( this.thumbnail );
        root.appendChild( this.nameTag );
        root.appendChild( this.login );
        root.appendChild( this.logout );
    }

    public setSession( session ) {
        console.log( session );
        this.session = session;
        this.updateSession();
    }

    private updateSession() {
        console.log( 'updateSession', this.session );
        this.nameTag.textContent = this.session ? this.session.user.username : 'anonymous';
        //this.thumbnail.innerHTML = this.session ? this.session.user.img : '';
        this.login.style.display = this.session ? 'none' : '';
        this.logout.style.display = this.session ? '' : 'none';
    }
}

export class AuthenticatorApi extends BladeApi<AuthenticatorBladeController> {

    public getSessions() {
        return this.controller.getSessions();
    }

    public setSession( session ) {
        this.controller.setSession( session );
    }

    public setAuthenticator( authenticator ) {
        this.controller.setAuthenticator( authenticator );
    }
    
    public updateSession( session ) {
        this.controller.view.setSession( session );
    }
}

interface PluginParams extends BaseBladeParams {
    view : 'authenticator';
};

export const AuthenticatorPlugin : BladePlugin<PluginParams> = createPlugin({
    id: 'authenticator',
    type: 'blade',
    accept( args ) {
        const result = parseRecord<PluginParams>( args, ( p ) => ({
            view: p.required.constant( 'authenticator' ),
          }));
      return result ? { params: result } : null;
    },
    controller( args ) {
        return new AuthenticatorBladeController( args.document, {
            blade : args.blade,
            viewProps: args.viewProps,
        } );
    },
    api: ( args ) => {
        if ( !( args.controller instanceof AuthenticatorBladeController ) ) {
            return null;
        }
        return new AuthenticatorApi( args.controller );
    },
});

export const AuthenticatorBundle : TpPluginBundle = {
    id: 'authenticator',
    plugins: [ AuthenticatorPlugin ],
    css: `.tp-authenticatorv { color: rgb(150, 150, 150); padding: 8px; user-select: none; }
    .tp-authenticatorv_root { display: flex; align-items: center; margin : 5px 0; }
    .tp-authenticatorv_thumbnail { width: 25px; height: 25px; background-color: #ddd; border-radius: 25%; margin-right: 8px; }
    .tp-authenticatorv_button { border: none; border-radius: 2px; color: rgb(80, 80, 80); background-color: #c1c1c1; cursor: pointer; font-size: 11px; margin: 0 4px; padding: 0px 3px; }
    `,
};