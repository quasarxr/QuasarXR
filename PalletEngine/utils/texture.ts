const _canvas = document.createElement( 'canvas' );

function convertDataTextureToImageBuffer(dataTexture) {
    const width = dataTexture.image.width;
    const height = dataTexture.image.height;
    const data = dataTexture.image.data;
    
    const buffer = new Uint8ClampedArray(width * height * 4);
    
    // 최대값 찾기
    let maxVal = 0;
    for (let i = 0; i < data.length; i++) {
      maxVal = Math.max(maxVal, data[i]);
    }
    
    // 간단한 톤 매핑 및 감마 보정 적용
    const gamma = 2.2;
    for (let i = 0; i < data.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        // 톤 매핑 (예: Reinhard 톤 매핑)
        let value = data[i + j] / maxVal;
        value = value / (1 + value);
        
        // 감마 보정
        value = Math.pow(value, 1 / gamma);
        
        buffer[i + j] = Math.round(value * 255);
      }
      buffer[i + 3] = 255; // 알파 채널
    }

    return buffer;
}

function drawBufferToCanvas(buffer, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const imageData = new ImageData(buffer, width, height);
    ctx.putImageData(imageData, 0, 0);

    return canvas;
}

export default class TextureUtil {
    static toImageUrl( dataTexture : any ) { /** extract image url from DataTexture */
        const buffer = convertDataTextureToImageBuffer(dataTexture);
        const canvas = drawBufferToCanvas(buffer, dataTexture.image.width, dataTexture.image.height);
        
        // Canvas를 이미지 URL로 변환
        return canvas.toDataURL();
    }
}
