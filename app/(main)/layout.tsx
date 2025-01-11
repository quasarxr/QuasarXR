import type { Metadata } from 'next';

import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';

import Header from '../components/header';
import '../global.css';

import { CSSProperties } from 'react';

export default function RootLayout( { children } : { children: React.ReactNode } ) {
    return (
      <div>
        <Header/>
        <main>
          {children} 
        </main>
      </div>
    )
}