const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl', { antialias: true });

if (!gl) {
    alert('Unable to initialize WebGL. Your browser may not support it.');
    throw new Error('WebGL not supported');
}

function resizeCanvasToDisplaySize(canvas) {
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }
}

let projectionMatrix = mat4.create();
let modelViewMatrix = mat4.create();

function initWebGL(splats) {

    let positions = [];

    let colors = []

    for (let i = 0; i < splats.length; i++) {
        positions.push(...splats[i].position); 

        let r = splats[i].color[0];
        let g = splats[i].color[1];
        let b = splats[i].color[2];
        let a = splats[i].color[3];

        r *= a;
        g *= a;
        b *= a;

        colors.push(r, g, b, a);
    }

    let scalingFactor = 1.0; 

    const colorBuffer = gl.createBuffer(); 
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

    mat4.perspective(projectionMatrix, glMatrix.toRadian(60), gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0);

    mat4.identity(modelViewMatrix); 
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 1.0, -4.0]); 
    mat4.scale(modelViewMatrix, modelViewMatrix, [1, -1, 1]);

    function render() {
        let startTime = performance.now();

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.depthMask(false);
        
        gl.clearColor(0.0, 0.0, 0.0, 1.0); 
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(shaderProgram);

        const scalingFactorLocation = gl.getUniformLocation(shaderProgram, 'uScalingFactor');
        gl.uniform1f(scalingFactorLocation, scalingFactor);
    
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'), false, projectionMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'), false, modelViewMatrix);
    
        const vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexPosition);;

        const vertexColor = gl.getAttribLocation(shaderProgram, 'aVertexColor'); 
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.vertexAttribPointer(vertexColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexColor);

        const vertexCount = positions.length / 3;
        gl.drawArrays(gl.POINTS, 0, vertexCount);

        gl.depthMask(true);

        let endTime = performance.now();
        let renderTime = endTime - startTime;

        console.log(`Render time: ${renderTime.toFixed(2)} ms`);
    }

    render();

    document.getElementById('scalingFactor').addEventListener('input', function(event) {
        scalingFactor = parseFloat(event.target.value);
        
        document.getElementById('scalingFactorValue').textContent = scalingFactor.toFixed(1);
        
        render();
    });
    
}

// Vertex shader program
const vertexShaderSource = `
attribute vec3 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uScalingFactor;

varying lowp vec4 vColor;
varying float vPointSize;

void main(void) {
    vec4 viewModelPosition = uModelViewMatrix * vec4(aVertexPosition, 1.0);
    float distance = -viewModelPosition.z;
    //  Perspective-correct scaling
    float size = (distance != 0.0) ? uScalingFactor / distance : 1.0;
    gl_PointSize = size;
    gl_Position = uProjectionMatrix * viewModelPosition;
    vColor = aVertexColor;
    vPointSize = size;
}
`;


// Fragment shader program
const fragmentShaderSource = `
precision mediump float;

varying lowp vec4 vColor;
varying float vPointSize;

void main(void) {
    // Gaussian falloff
    float radius = vPointSize / 2.0;

    vec2 center = vec2(0.5, 0.5);
    vec2 coord = gl_PointCoord - center;
    float distance = length(coord * vec2(radius, radius));
    
    float sigma = radius;
    float gaussian = exp(-0.5 * (distance * distance) / sigma);
    
    gl_FragColor = vec4(vColor.rgb, vColor.a * gaussian);
}
`;



const splatFileUrl = 'data/train.splat'; // [nike.splat, plush.splat, train.splat]
readSplatFile(splatFileUrl, splats => {

    splats.sort((a, b) => b.position[2] - a.position[2]);
    initWebGL(splats);
});