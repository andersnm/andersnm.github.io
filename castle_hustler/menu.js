
class MenuButton extends RenderObject {
    constructor(screen, gl, label, index, buttonImg) {
        super(screen, gl, label);

        this.label = label;
        this.index = index;
        this.scale = 0.4;
        this.offsetY = 0;
        this.offsetX = 0;
        this.visible = true;
        
        const texture = new Texture(gl, buttonImg);
        texture.context.font = '150px sans-serif';
        texture.context.fillStyle = "#222";
        texture.context.fillText(this.label, 150, 192);
        texture.updateTexture();

        this.buttonImg = buttonImg;
        this.playBtnImgNode = new TexturedQuadNode(screen, gl, texture);
        /*this.playBtnImgNode.context.font = '150px sans-serif';
        this.playBtnImgNode.context.fillStyle = "#222";
        this.playBtnImgNode.context.fillText(this.label, 150, 192);
        this.playBtnImgNode.updateTexture();*/

        // this.playBtnImgNode = new ImageTextureNode(screen, gl, "buttong.png");
        this.hover = false;
        this.pressed = false;
        
        this.appendChild(this.playBtnImgNode);
        // this.load();
    }
    
    /*async load() {
        await this.playBtnImgNode.load();
        this.playBtnImgNode.context.font = '150px sans-serif';
        this.playBtnImgNode.context.fillStyle = "#222";
        this.playBtnImgNode.context.fillText(this.label, 150, 192);
        this.playBtnImgNode.updateTexture();
    }*/

    isMouseOver(x, y) {
        const playBtnRect = { x: this.playBtnImgNode.offsetX, y: this.playBtnImgNode.offsetY, width: this.buttonImg.width * this.scale, height: this.buttonImg.height * this.scale }
        return x >= playBtnRect.x && x < playBtnRect.x + playBtnRect.width && y >= playBtnRect.y && y < playBtnRect.y + playBtnRect.height;
    }
    
    mouseMove(x, y) {
        if (!this.visible) {
            return;
        }

        if (this.isMouseOver(x, y)) {
            if (!this.hover) {
                this.hover = true;
            }
            // animte button if not animated -> change scale a lil bit
            
        } else {
            this.pressed = false;
        
            if (this.hover) {
                this.scale = 0.4;
                this.hover = false;
            }
        }
    }
    
    mouseDown(x, y) {
        if (!this.visible) {
            return;
        }
        
        this.pressed = true;
    }
    
    mouseUp(x, y) {
        if (!this.visible) {
            return;
        }

        if (this.pressed && this.isMouseOver(x, y)) {
            this.dispatchEvent(new CustomEvent("click", { detail: this }));
        }
        
        this.pressed = false;
    }
    
    update(t) {
        if (!this.visible) {
            return;
        }

        let hoverScale = 0;
        if (this.hover) {
            hoverScale = (Math.sin(t * Math.PI * 3) / 100);
        }
        
        this.playBtnImgNode.scale = this.scale + hoverScale;
        
        // adjust pos by diff of hover scale
        this.playBtnImgNode.offsetY = this.offsetY - (this.buttonImg.height * hoverScale / 2);
        this.playBtnImgNode.offsetX = this.offsetX - (this.buttonImg.width * hoverScale / 2);
    }
/*
    draw() {
        if (!this.visible) {
            return;
        }

        this.playBtnImgNode.draw();
    }*/
}


/*
class Menu extends RenderObject {
    constructor(screen, gl) {
        super(screen, gl);
    }
}*/

async function runMenu(parent) {
    const buttonImg = await createImage("buttong.png");
    const bgImg = await createImage("woodbg2.jpg");
    const logoImg = await createImage("casterlogo.png");

    const bgImgNode = new Tex2Node(parent.screen, parent.gl, bgImg);
    const playBtn = new MenuButton(parent.screen, parent.gl, "PLAY", 0, buttonImg);
    const aboutBtn = new MenuButton(parent.screen, parent.gl, "ABOUT", 1, buttonImg);
    const logoImgNode = new Tex2Node(parent.screen, parent.gl, logoImg);

    playBtn.offsetY = 475;
    aboutBtn.offsetY = 575;
    playBtn.offsetX = (parent.screen.width / 2) - (buttonImg.width * playBtn.scale) / 2;
    aboutBtn.offsetX = (parent.screen.width / 2) - (buttonImg.width * aboutBtn.scale) / 2;

    logoImgNode.offsetX = (parent.screen.width / 2) - (logoImg.width) / 2;
    logoImgNode.offsetY = 0;

    parent.appendChild(bgImgNode);
    parent.appendChild(logoImgNode);
    parent.appendChild(playBtn);
    parent.appendChild(aboutBtn);
    
    const promise = new Promise((resolve, reject) => {

        playBtn.addEventListener("click", async e => {
            console.log("CLICK PLAY");
            resolve("play");
        });

        aboutBtn.addEventListener("click", e => {
            console.log("CLICK ABOUT");
            resolve("about");
        });
    });

    const result = await promise;

    console.log("FADING OUT", parent, (new Error()).stack);
    await parent.animate(0, 0.5, t => {
        const ft = t * t * t;
        bgImgNode.multiplier[3] = 1 - t;
        playBtn.offsetY = 475 + ft * 300;
        aboutBtn.offsetY = 575 + ft * 300;
        logoImgNode.offsetY = -ft * 500;
    });
    
    // removeChild all that was added

    return result;
}