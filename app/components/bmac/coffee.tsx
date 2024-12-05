'use client';

import { CSSProperties } from 'react';
import { useState } from 'react';

interface BmcaWidgetProps {
    style?: CSSProperties;
}

export default function BmcaWidget( { style } : BmcaWidgetProps ) {
    const [isScriptActive, setIsScriptActive ] = useState( false );
    return <div id='bmac-container' style={style}>
        { isScriptActive && (
            <script 
                data-name="BMC-Widget" 
                data-cfasync="false" 
                src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js" 
                data-id="quasarxr" 
                data-description="Support me on Buy me a coffee!" 
                data-message="Support QuasarXR" 
                data-color="#40DCA5" 
                data-position="Right" 
                data-x_margin="18" 
                data-y_margin="18">
            </script>
        ) }        
    </div>
}