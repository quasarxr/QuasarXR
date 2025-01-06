'use client'

import '@/styles/global.css';
import PalletComponent from '@/app/components/engine/palletComponent';

export default function Page() {

  const styleText = {
    width: "100%",
    height: "100%",
    background: "#3c3c3c"
  };

  return (
  <div style={styleText}>    
    <div>
      <PalletComponent url={""} mode={"editor"} size={{ width : "100vw", height: "100vh" }} scroll={false}></PalletComponent>
    </div>
  </div> );
}