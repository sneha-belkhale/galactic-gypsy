const HeroShader = {

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,

  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D texture;
    uniform float n_rows;
    uniform float n_cols;
    uniform float frameIndex;
    void main() {
      //calculate new vUv position
      vec2 uv = vUv;
      float row = floor( frameIndex / n_cols );
      float col = frameIndex - row * n_cols;
      uv.x = (col + uv.x)/n_cols;
      uv.y = (row + uv.y)/n_rows;
      gl_FragColor = texture2D(texture, uv);
    }
  `,
};

export default HeroShader;
