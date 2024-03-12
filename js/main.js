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

    let cornerOffsets = [];
    
    let offsets = [
        [-0.01, -0.01], // Bottom left corner
        [ 0.01, -0.01], // Bottom right corner
        [ 0.01,  0.01], // Top right corner
        [-0.01,  0.01], // Top left corner
    ];

    let indices = [];

    for (let i = 0; i < splats.length; i++) {
        // Add each point 4 times (corners) and color for each 
        for(let j = 0; j < 4; j++) {
            positions.push(...splats[i].position); 
            colors.push(...splats[i].color.slice(0, 3), 1.0);
            cornerOffsets.push(...offsets[j])
        }
    }

    for (let i = 0; i < splats.length * 4; i += 4) { // *4 because each splat now has 4 vertices
        // First triangle
        indices.push(i, i + 1, i + 2);
        // Second triangle
        indices.push(i, i + 2, i + 3);
    }

    console.log('positions.length')
    console.log(positions.length)

    console.log('colors.length')
    console.log(colors.length)

    console.log('cornerOffsets.length')
    console.log(cornerOffsets.length)

    let scalingFactor = 0.9; // Adjust as needed

    // Create and bind the color buffer
    const colorBuffer = gl.createBuffer(); 
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    

    // Create a buffer for the vertex positions
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Create a buffer for the corner offsets
    const cornerOffsetBuffer = gl.createBuffer(); 
    gl.bindBuffer(gl.ARRAY_BUFFER, cornerOffsetBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cornerOffsets), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);    

    // Load and compile the shaders and link them into a program
    const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

    // Projection matrix
    mat4.perspective(projectionMatrix, glMatrix.toRadian(60), gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0);

    // Model-view matrix
    mat4.identity(modelViewMatrix); // Start with the identity matrix
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.9, -1.5, -7.0]); // Move the camera back a bit

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
        const vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexPosition);;

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // Bind the color buffer, set vertex attribute
        const vertexColor = gl.getAttribLocation(shaderProgram, 'aVertexColor'); // Get the attribute location
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.vertexAttribPointer(vertexColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexColor);

        const cornerOffsetLocation = gl.getAttribLocation(shaderProgram, 'aCornerOffset');
        gl.enableVertexAttribArray(cornerOffsetLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, cornerOffsetBuffer);
        gl.vertexAttribPointer(cornerOffsetLocation, 2, gl.FLOAT, false, 0, 0);


        // Draw the points
        const count = indices.length;
        gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0); // each point has 3 coordinates
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
attribute vec2 aCornerOffset; // This is the new attribute

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uScalingFactor;

varying lowp vec4 vColor;

void main(void) {
    vec4 viewModelPosition = uModelViewMatrix * vec4(aVertexPosition, 1.0);
    float distance = -viewModelPosition.z;

    //  Perspective-correct scaling
    float size = (distance != 0.0) ? 2.0 * uScalingFactor / distance : 1.0;
    
    vec2 scaledOffset = aCornerOffset * size;
    
    // Apply the offset to viewModelPosition in the xy-plane
    viewModelPosition.xy += scaledOffset;

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
    console.log('splats')
    console.log(splats)

    // Once splats are loaded, initialize WebGL resources and start rendering
    initWebGL(splats);
});