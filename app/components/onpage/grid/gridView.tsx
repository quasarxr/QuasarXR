'use client'

import { CSSProperties } from 'react';
import GridItem from './gridItem';

type Parameters = {
    row? : number;
    column? : number;
}

const itemStyle = {
    display: "grid",
    width: "100%",
    height: "auto",
    margin: "100px 50px",
    gap: "16px",
    gridTemplateColumns: "repeat(auto-fit, 330px)",
    justifyContent: "center"    
};

export default function GridView( { } : Parameters ) {

    return ( <div style={itemStyle}>
        <GridItem/>
        <GridItem/>
        <GridItem/>
        <GridItem/>
        <GridItem/>
        <GridItem/>
        <GridItem/>
        <GridItem/>
        <GridItem/>
        <GridItem/>
    </div>)
}