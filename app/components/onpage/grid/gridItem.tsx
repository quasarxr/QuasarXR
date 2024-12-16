'use client'

import { CSSProperties, useState } from "react";
import Link from 'next/link';

type Parameters = {
    image? : ImageBitmap;
    randomize? : boolean;
    title? : string;
    tags? : string[];
    url? : string;
}

const itemStyle : CSSProperties = {
    aspectRatio: "16 / 9.5",
    borderRadius: "10px",
    backgroundColor: "white",
    //margin: "10px 20px",
    overflow: "hidden",
};

const thumbStyle : CSSProperties = {
    position: "static",
    width: "100%",
    height: "100%",
    backgroundColor: "pink",
    textAlign: "center",
    alignContent: "center",
}

const contentBaseStyle : CSSProperties = {
    width: "100%",
    height: "60px",
    backgroundColor: "rgba( 90, 90, 90, 0.7)",
    position: "static",
    top: "100%",
    transition: "transform 0.3s ease-in-out",
};

const contentHoverStyle : CSSProperties = {
    transform: "translateY(-60px)",
}

export default function GridItem( {} : Parameters ) {
    const [ isHovered, setIsHovered ] = useState(false);

    return (<div style={itemStyle}
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}>
        <div style={thumbStyle}>thumbnail</div>
        <div style={{ ...contentBaseStyle, ...(isHovered ? contentHoverStyle : {}), }}>properties</div>
    </div>);
}