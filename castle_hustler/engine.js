class RenderScreen {
    constructor(width, height) {
        this.width = width || 640;
        this.height = height || 480;
        this.textures = {};
    }
}

function nearestPow2(x) {
    return Math.pow(2, Math.ceil(Math.log(x) / Math.log(2)));
}

const vertexShader = `
attribute vec3 coordinates;
uniform vec2 offset;
uniform float scale;
uniform vec2 screenSize;  // internal resolution, f.ex 1280x720
uniform vec2 textureSize; // full texture size is ^2
uniform vec2 visibleSize; // the visible size is <= ^2
varying vec2 uv;

void main() {
    float xr = (2.0 / screenSize.x) * textureSize.x; // 256.0;
    float yr = (2.0 / screenSize.y) * textureSize.y; // 256.0;

    float nx = (coordinates.x + 0.5) * (visibleSize.x / textureSize.x); // x -> 0..1 -> 0..width
    float ny = (coordinates.y + 0.5) * (visibleSize.y / textureSize.y); // y -> 0..1 -> 0..height
    
    float ox = (2.0 / screenSize.x) * offset.x;
    float oy = (2.0 / screenSize.y) * offset.y;

    uv = vec2(nx, ny);
    gl_Position = vec4(ox + nx * xr * scale - 1.0, -oy + (ny * yr * scale - 1.0) * -1.0, 0.0, 1.0);
}
`;

const fragmentShader = `
#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D texture;
uniform vec4 multiplier;
varying vec2 uv;

void main() {
    vec4 c = texture2D(texture, uv);
    if (c.r + c.g + c.b == 0.0) {
        // c.a = 0.0;
        // c.r = 0.0;
    }
    // c.a = 1.0;
    gl_FragColor = c * multiplier; //texture2D(texture, uv);
}
`;


function checkShader(gl, shader) {
    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (compiled) {
        return;
    }

    const compilationLog = gl.getShaderInfoLog(shader);
    console.log('Compile shader failed: ' + compilationLog);
}

class RenderObject extends EventTarget {
    constructor(screen, gl) {
        super();
        this.screen = screen;
        this.gl = gl;
        this.animators = [];
        this.childNodes = [];
    }

    appendChild(node) {
        this.childNodes.push(node);
    }

    removeChild(node) {
        const i = this.childNodes.indexOf(node);
        if (i == -1) return ;
        this.childNodes.splice(i, 1);
    }

    draw() {
        for (let childNode of this.childNodes) {
            childNode.draw();
        }
    }

    update(t) {
        // console.log("AM UPDATE", this.constructor);
        this.updateAnimators(t);

        for (let childNode of this.childNodes) {
            childNode.update(t);
        }
    }

    mouseMove(x, y) {
        const childNodes = [ ... this.childNodes ];
        for (let childNode of childNodes) {
            childNode.mouseMove(x, y);
        }
    }

    mouseDown(x, y) {
        const childNodes = [ ... this.childNodes ];
        for (let childNode of childNodes) {
            childNode.mouseDown(x, y);
        }
    }

    mouseUp(x, y) {
        const childNodes = [ ... this.childNodes ];
        for (let childNode of childNodes) {
            childNode.mouseUp(x, y);
        }
    }
    
    animate(waitSec, durationSec, callback) {
        // call the back as often as possible, starting after waitSec, for durationSec, with a linear t parameter in range 0-1
        // return promise that resolves after waitSec+durationSec
        
        return new Promise((resolve, reject) => {
            console.log("PISHING ANIMTOR");
            this.animators.push({
                resolver: resolve,
                waitSec: waitSec,
                durationSec: durationSec,
                callback: callback,
                start: Date.now(),
            });
        });
        
    }

    updateAnimators(t) {
        let animators = [...this.animators];
        for (let animator of animators) {
            const start = animator.start / 1000;
            // console.log("UPDATING", t, start + animator.waitSec);
            let rangeStart = start + animator.waitSec;
            if (t < rangeStart) {
                continue;
            }
            
            let rangeEnd = start + animator.waitSec + animator.durationSec;

            let rangeOffset = (t - rangeStart) / (rangeEnd - rangeStart);
            animator.callback(rangeOffset);

            if (t >= rangeEnd) {
                const ai = this.animators.findIndex(a => a === animator);
                this.animators.splice(ai, 1);
                animator.resolver();
            }
        }
    }
}

class TexturedQuadNode extends RenderObject {
    constructor(screen, gl, texture) {
        super(screen, gl);
        this.visibleWidth = 0;
        this.visibleHeight = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        this.multiplier = [ 1, 1, 1, 1 ];
        this.visible = true;

        const vertices = [
            -0.5, 0.5, 0.0,
            -0.5, -0.5, 0.0,
            0.5, -0.5, 0.0,
            0.5, 0.5, 0.0 
        ];

        const indices = [3, 2, 1, 3, 1, 0];

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        this.texture = texture || new Texture(gl); // gl.createTexture();

        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vertexShader);
        gl.compileShader(vs);
        checkShader(gl, vs);

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fragmentShader);
        gl.compileShader(fs);
        checkShader(gl, fs);

        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);

        // checkProgram() if (gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
        
        this.coordLocation = gl.getAttribLocation(this.program, "coordinates");
        this.textureLocation = gl.getUniformLocation(this.program, "texture");
        this.screenSizeLocation = gl.getUniformLocation(this.program, "screenSize");
        this.textureSizeLocation = gl.getUniformLocation(this.program, "textureSize");
        this.visibleSizeLocation = gl.getUniformLocation(this.program, "visibleSize");
        this.offsetLocation = gl.getUniformLocation(this.program, "offset");
        this.scaleLocation = gl.getUniformLocation(this.program, "scale");
        this.multiplierLocation = gl.getUniformLocation(this.program, "multiplier");
    }
    
    draw() {
        if (!this.visible) {
            return;
        }

        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer); 
        gl.bindTexture(gl.TEXTURE_2D, this.texture.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.useProgram(this.program);
        gl.vertexAttribPointer(this.coordLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.coordLocation);
        gl.uniform1i(this.textureLocation, 0);
        // console.log(this.screen);
        gl.uniform2f(this.screenSizeLocation, this.screen.width, this.screen.height);
        gl.uniform2f(this.textureSizeLocation, this.texture.canvas.width, this.texture.canvas.height);
        gl.uniform2f(this.visibleSizeLocation, this.texture.width, this.texture.height);
        gl.uniform2f(this.offsetLocation, this.offsetX, this.offsetY);
        gl.uniform1f(this.scaleLocation, this.scale);
        gl.uniform4f(this.multiplierLocation, ...this.multiplier);

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0); // 6 = indices.length
        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
}

class ImageNode extends TexturedQuadNode {
    constructor(screen, gl, src) {
        super(screen, gl);

        this.canvas = new Image();
        this.canvas.addEventListener("load", e => {
            console.log("LOADED IMAGE");
            this.visibleWidth = this.canvas.width;
            this.visibleHeight = this.canvas.height;
            this.updateTexture();
        });

        this.canvas.src = src;
    }
    
    updateTexture() {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);
        
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        // TODO: transfer invalidated region(s?) to texture using gl.pixelStorei + gl.texImage2D?
    }
}

class TexNode extends TexturedQuadNode {
    constructor(screen, gl, width, height) {
        super(screen, gl);

        this.canvas = document.createElement("canvas");
        this.visibleWidth = width;
        this.visibleHeight = height;
        this.canvas.width = nearestPow2(width);
        this.canvas.height = nearestPow2(height);

        this.context = this.canvas.getContext("2d");
        this.texture.initEmpty(width, height);
    }
    
    updateTexture() {
        const gl = this.gl;

        gl.bindTexture(gl.TEXTURE_2D, this.texture.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);
        
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        // TODO: transfer invalidated region(s?) to texture using gl.pixelStorei + gl.texImage2D?
    }
}

async function createImage(src) {
    const img = new Image();
    const promise = new Promise((resolve, reject) => {
        img.addEventListener("load", e => {
            resolve(img);
        });
        img.addEventListener("error", e => {
            console.error("File not found" + src);
            reject(e);
        });
    });
    
    img.src = src;

    return await promise;
}

class Texture {
    constructor(gl, image) {
        this.gl = gl;
        this.texture = gl.createTexture();
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");
        this.width = 0;
        this.height = 0;

        if (image) {
            this.initFromImage(image);
        }
    }
    
    async initFromSrc(src) {
        const img = await createImage(src);
        this.initFromImage(img);
    }

    initEmpty(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = nearestPow2(width);
        this.canvas.height = nearestPow2(height);
        
        this.updateTexture();
    }
    
    initFromImage(image) {
        this.width = image.width;
        this.height = image.height;
        this.canvas.width = nearestPow2(image.width);
        this.canvas.height = nearestPow2(image.height);
        
        this.context.drawImage(image, 0, 0);
        this.updateTexture();
    }
    
    updateTexture() {
        const gl = this.gl;

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);
        
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        // TODO: transfer invalidated region(s?) to texture using gl.pixelStorei + gl.texImage2D?
    }
}

class Tex2Node extends TexturedQuadNode {
    constructor(screen, gl, image) {
        super(screen, gl);
        // this.image = image;
        this.texture.initFromImage(image);
        /*this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");

        this.visibleWidth = this.image.width;
        this.visibleHeight = this.image.height;
        this.canvas.width = nearestPow2(this.image.width);
        this.canvas.height = nearestPow2(this.image.height);
        
        this.context.drawImage(this.image, 0, 0);
        this.updateTexture();*/
    }
    
    /*updateTexture() {
        const gl = this.gl;

        gl.bindTexture(gl.TEXTURE_2D, this.texture.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);
        
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        // TODO: transfer invalidated region(s?) to texture using gl.pixelStorei + gl.texImage2D?
    }*/
}

class ImageTextureNode extends TexturedQuadNode {
    constructor(screen, gl, src) {
        super(screen, gl);

        this.src = src;
        this.image = new Image();
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");
    }

    async load() {
        await this.loadImage(this.image, this.src);
        this.visibleWidth = this.image.width;
        this.visibleHeight = this.image.height;
        this.canvas.width = nearestPow2(this.image.width);
        this.canvas.height = nearestPow2(this.image.height);
        
        console.log(this.src, this.image);
        this.context.drawImage(this.image, 0, 0);

        this.updateTexture();
    }
    
    loadImage(img, src) {
        // const img = new Image();
        const promise = new Promise((resolve, reject) => {
            img.addEventListener("load", e => {
                resolve(img);
            });
            img.addEventListener("error", e => {
                console.error("File not found" + src);
                reject(e);
            });
        });

        img.src = src;
        return promise;
    }

    updateTexture() {
        const gl = this.gl;

        gl.bindTexture(gl.TEXTURE_2D, this.texture.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);
        
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        // TODO: transfer invalidated region(s?) to texture using gl.pixelStorei + gl.texImage2D?
    }
}

class GroupNode {
    // group of nodes with shared visual properties? blend? offset? clip?
    // layout?
}


class GraphManager extends RenderObject {

    constructor(screen, gl) {
        super(screen, gl);
        
        this.resize(document.documentElement.clientWidth, document.documentElement.clientHeight);

        window.addEventListener("resize", e => {
          this.resize(document.documentElement.clientWidth, document.documentElement.clientHeight);
        });

        // the game updates at its own fps
        const fps = 30;
        const startTime = Date.now();

        setInterval(() => {
            const t = Date.now(); // - startTime;
            this.update(t / 1000);
        }, 1000 / fps);
    }
    
    static attach(c) {
        const gl = c.getContext("webgl");
        const screen = new RenderScreen(1280, 720);
        const gm = new GraphManager(screen, gl);

        c.addEventListener("mousemove", e => {
            const rect = c.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
            
            // scale to internal coordinates
            x = x * (screen.width / c.width);
            y = y * (screen.height / c.height);
            
            // console.log("mousemove", e.clientX - rect.left, e.clientY - rect.top);
            gm.mouseMove(x, y);
        });

        c.addEventListener("mousedown", e => {
            const rect = c.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
            
            // scale to internal coordinates
            x = x * (screen.width / c.width);
            y = y * (screen.height / c.height);
            
            // console.log("mousemove", e.clientX - rect.left, e.clientY - rect.top);
            gm.mouseDown(x, y);
        });

        c.addEventListener("mouseup", e => {
            const rect = c.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
            
            // scale to internal coordinates
            x = x * (screen.width / c.width);
            y = y * (screen.height / c.height);
            
            // console.log("mousemove", e.clientX - rect.left, e.clientY - rect.top);
            gm.mouseUp(x, y);
        });
        
        return gm;
    }
    
    /*appendChild(node) {
        this.nodes.push(node);
    }

    removeChild(node) {
        const i = this.nodes.indexOf(node);
        if (i == -1) {
            return;
        }

        this.nodes.splice(i, 1);
    }*/
    
    resize(width, height) {
        // c should always be ratio; 
        // 1280, 720
        // my w/h; 1536 466 -> 
        const targetRatio = this.screen.width / this.screen.height; //720;
        
        const ratio = width / height;
        console.log("t/r", targetRatio, ratio);
        
        // this is if screenW > w
        if (targetRatio < ratio) {
            width = width * (targetRatio / ratio);
            // 
        } else {
            console.log("OTHERCASE");
            height = height * (ratio / targetRatio);
        }
        // c.height = height // * ratio;

        this.width = c.width = width;
        this.height = c.height = height;
        console.log(width, height);
    }

    render() {
        const gl = this.gl;

        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);

        // Enable the depth test
        // gl.enable(gl.DEPTH_TEST);

        // Clear the color buffer bit
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Set the view port
        // this.gl.viewport(0, 0, 1280, 720);
        gl.viewport(0, 0, this.width, this.height);

        super.draw();
        /*for (let node of this.nodes) {
            node.draw();
        }*/
    }
    
    /*mouseMove(x, y) {
        for (let node of this.nodes) {
            node.mouseMove(x, y);
        }
    }

    mouseDown(x, y) {
        for (let node of this.nodes) {
            node.mouseDown(x, y);
        }
    }

    mouseUp(x, y) {
        for (let node of this.nodes) {
            node.mouseUp(x, y);
        }
    }*/

}

/*
let animators = [];

async function animate(startTime, duration, callback) {
    let currentTime = null;
    const animator = {
        update(t) {
            if (currentTime === null) {
                currentTime = t;
                startTime += t;
            }

            if (startTime > t) {
                return;
            }

            callback((t - startTime) / duration);
            
            if (t - startTime >= duration) {
                const index = animators.indexOf(animator);
                animators.splice(index, 1);
            }
        }
    };
    
    animators.push(animator);
}
*/