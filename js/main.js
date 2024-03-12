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

    // console.log(splats)

    let positions = [

    ];
    let colors = [
    ]

    // // Loop through each splat and add its position to the positions array
    // splats.forEach(splat => {
    //     positions.push(...splat.position); // Using the spread operator to add elements
    //     colors.push(...splat.color)
    // });

    for (let i = 0; i < splats.length; i++) {
        positions.push(...splats[i].position);
        colors.push(...splats[i].color.slice(0, 3), 1.0);
    }

    console.log(positions)

    console.log(colors)

    // Create and bind the color buffer
    const colorBuffer = gl.createBuffer(); 
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    

    // Create a buffer for the vertex positions
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Load and compile the shaders and link them into a program
    const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

    const vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');

    // Projection matrix
    mat4.perspective(projectionMatrix, glMatrix.toRadian(60), gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0);

    // Model-view matrix
    mat4.identity(modelViewMatrix); // Start with the identity matrix
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.9, -1.5, -5.0]); // Move the camera back a bit

    let scalingFactor = 1.0; // Adjust as needed

    function render() {
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
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexPosition);;
    
        // Bind the color buffer, set vertex attribute
        const vertexColor = gl.getAttribLocation(shaderProgram, 'aVertexColor'); // Get the attribute location
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.vertexAttribPointer(vertexColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexColor);
    
        // Draw the points
        gl.drawArrays(gl.POINTS, 0, positions.length / 3);
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
    gl_Position = uProjectionMatrix * viewModelPosition;
    float distance = -viewModelPosition.z; // Use negative distance for proper scaling
    gl_PointSize = (distance != 0.0) ? uScalingFactor / distance : 1.0; // Avoid division by zero
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
    // Once splats are loaded, initialize WebGL resources and start rendering
    initWebGL(splats);
});