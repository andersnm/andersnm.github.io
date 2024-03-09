export function loadImageAsync(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            resolve(image);
        };
        image.onerror = (e) => {
            reject(e);
        };

        image.src = src;
    });
}


export class RenderObject {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.modifiers = [];
    }

    draw() {
        console.error("draw() is not implemented in " + this.constructor.name);
    }
    
    click() {
    }
}

export function roundRect(x, y, w, h, r) {
  // https://stackoverflow.com/a/7838871
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x+r, y);
  this.arcTo(x+w, y,   x+w, y+h, r);
  this.arcTo(x+w, y+h, x,   y+h, r);
  this.arcTo(x,   y+h, x,   y,   r);
  this.arcTo(x,   y,   x+w, y,   r);
  this.closePath();
  return this;
}

export class Scene {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderItems = [];
        this.startTime = Date.now();
        setInterval(() => this.tick(), 100);
    }

    tick() {
        /*const t = Date.now();
        
        this.state.tick(t);*/
        console.log("Tick not implemented in scene");
    }

    click(x, y) {
        for (let renderItem of this.renderItems) {
            if (x >= renderItem.x && x < renderItem.x + renderItem.width && y >= renderItem.y && y < renderItem.y + renderItem.height) {

                renderItem.click(x, y);
            }
        }
    }
    
    resize() {
        // canvas.width, canvas.height
        this.background.width = this.canvas.width;
        this.background.height = this.canvas.height;
    }
    

    render() {
        var context = this.canvas.getContext("2d");
        // context.clearRect(0, 0, canvas.width, canvas.height);

        // const t = Date.now();
        // console.log(this.renderItems.length);
        for (let renderItem of this.renderItems) {
            renderItem.draw();
        }

        // console.log((Date.now() - t) / 1000);

        requestAnimationFrame(t => this.render(t));
        // requestAnimationFrame(t => this.render(t));

    }
}