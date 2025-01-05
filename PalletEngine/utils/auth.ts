type SessionDescriptor = {
    user : {
        username : string;
        img : string;
    }
}

type AuthLogics = {
    login : () => void;
    logout : () => void;
}

interface AuthParams {
    session : SessionDescriptor | null;
    logics : AuthLogics;
}


export class AuthController {

    session : SessionDescriptor | null;
    logics : AuthLogics;

    constructor( params : AuthParams ) {
        this.session = params.session;
        this.logics = params.logics;        
    }

    updateSession( session : SessionDescriptor ) {
        this.session = session;
    }

    login() {
        this.logics.login();
    }

    logout() {
        this.logics.logout();
    }
}