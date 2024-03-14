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

// Global scope for example purposes
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

    console.log('positions.length')
    console.log(positions.length)

    console.log('colors.length')
    console.log(colors.length)

    let scalingFactor = 0.05; // Adjust as needed

    const colorBuffer = gl.createBuffer(); 
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

    mat4.perspective(projectionMatrix, glMatrix.toRadian(60), gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0);

    mat4.identity(modelViewMatrix); 
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 2.0, -5.0]); 
    mat4.scale(modelViewMatrix, modelViewMatrix, [1, -1, 1]); // Flip on Y-axis

    function render() {
        // gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        // Disable writing to the depth buffer
        gl.depthMask(false);
        
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(shaderProgram);

        // Set the scaling factor uniform
        const scalingFactorLocation = gl.getUniformLocation(shaderProgram, 'uScalingFactor');
        gl.uniform1f(scalingFactorLocation, scalingFactor);
    
        // Set the shader uniforms for projection and model-view matrices
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'), false, projectionMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'), false, modelViewMatrix);
    
        // Bind the position buffer, set vertex attribute
        const vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexPosition);;

        // Bind the color buffer, set vertex attribute
        const vertexColor = gl.getAttribLocation(shaderProgram, 'aVertexColor'); // Get the attribute location
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.vertexAttribPointer(vertexColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexColor);

        const vertexCount = positions.length / 3;
        gl.drawArrays(gl.POINTS, 0, vertexCount); // each point has 3 coordinates

        //  Re-enable writing to the depth buffer for subsequent opaque objects
        gl.depthMask(true);

    }

    render();

    // Update the scaling factor from the slider and re-render
    document.getElementById('scalingFactor').addEventListener('input', function(event) {
        scalingFactor = parseFloat(event.target.value);
        render(); // Call the render function to update the scene with the new scaling factor
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

void main(void) {
    vec4 viewModelPosition = uModelViewMatrix * vec4(aVertexPosition, 1.0);
    float distance = -viewModelPosition.z;
    //  Perspective-correct scaling
    float size = (distance != 0.0) ? uScalingFactor / distance : 1.0;
    gl_PointSize = size;
    gl_Position = uProjectionMatrix * viewModelPosition;
    vColor = aVertexColor;
}

`;


// Fragment shader program
const fragmentShaderSource = `
precision mediump float;

varying lowp vec4 vColor;

void main(void) {
    // Create a circular point
    gl_FragColor = vColor;
}
`;



// Adjusted readSplatFile call to initialize WebGL resources after data is loaded
const splatFileUrl = 'data/nike.splat';
readSplatFile(splatFileUrl, splats => {

    // Sort splats from nearest to furthest relative to the camera, assuming camera looks down the positive Z-axis  
    splats.sort((a, b) => b.position[2] - a.position[2]);

    console.log(splats)

    // Once splats are loaded, initialize WebGL resources and start rendering
    initWebGL(splats);
});