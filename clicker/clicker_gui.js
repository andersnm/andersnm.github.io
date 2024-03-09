import { GameState, getItemCost, getItemsCost, getItemIncome, printNumber } from './clicker.js';
import { Scene, RenderObject, roundRect, loadImageAsync } from './render.js';

/*function printNumber(n) {
    if (n < 100) {
        return n.toFixed(2);
    } else if (n < 1000000) {
        return n.toFixed(0);
    } else if (n < 1000000000) {
        return (n / 1000000).toFixed(2) + "M";
    } else {
        return (n / 1000000000).toFixed(2) + "B";
    }
}*/

class ItemButton extends RenderObject {
    constructor(game, x, y, width, height, item) {
        super(x, y, width, height);
        this.game = game;
        this.item = item;
        this.image = null;
        // this.modifiers.push({self: game, name: "totalAmount" });
        this.modifiers.push({self: game, name: "currentTime" });
    }
    
    draw() {
        var context = this.game.canvas.getContext("2d");
        context.font = '24px sans-serif';

		var cost = getItemCost(this.item);
        
		context.fillStyle = "#393";
		context.fillRect(this.x, this.y, this.width, this.height);
        
        context.strokeStyle = "#fff";
        context.lineWidth = 1;
        context.shadowBlur = 2;
        context.shadowColor = "white";
        context.beginPath();
        context.roundRect(this.x, this.y, this.width, this.height, 8);
        context.stroke();

        context.shadowBlur = 0;
        // context.lineWidth = 1;

        // draw icon
        // context.drawImage(this.game.cityImage, this.x, this.y, this.width, this.height)
        
		if (this.item.startTime != null) {
			const progress = Math.min(1, (this.game.state.currentTime - this.item.startTime) / this.item.baseTime);
            context.fillStyle = "#262";
            context.fillRect(this.x, this.y + this.height - 10, this.width * progress, 10);
			// context.fillText("Progress: " + (progress * 100).toFixed(), itemsX + 70, itemsY + i * 50 + 41);
		}

		context.fillStyle = "#000000";
		context.fillStyle = "#fff";
		context.fillText(this.item.name, this.x + 10, this.y + 24);

        context.font = '32px sans-serif';
        // context.fillStyle = "#000000";
        context.textAlign = "right";
		context.fillText(this.item.owned, this.x + 300 - 20, this.y + 48);
        context.textAlign = "left";
		// context.fillText("Owned: " + this.item.owned, this.x + 150, this.y + 24);
		

        context.font = '18px sans-serif';
        if (this.game.state.totalAmount < cost) {
            context.fillStyle = "#cc0000";
        }

		context.fillText("Cost: " + printNumber(cost), this.x + 10, this.y + 24 + 24);

        // earns per sec
        const perSec = getItemIncome(this.item) / this.item.baseTime * 1000;
		context.fillStyle = "#fff";
        context.fillText(printNumber(perSec) + "/s", this.x + 150, this.y + 24 + 24);
    }
    
    click(e) {
        console.log("clicked ", this.item);
        console.log(this.game);
        
        if (!this.game.state.buyItem(this.item)) {
            return;
        }

        // Quick way to lay out upgrades again
        this.game.initGameScreen();
    }
}

class UpgradeButton extends RenderObject {
    constructor(game, x, y, width, height, upgrade) {
        super(x, y, width, height);
        this.game = game;
        this.upgrade = upgrade;
        this.modifiers.push({self: game, name: "totalAmount" });
    }
    
    draw() {
        var context = this.game.canvas.getContext("2d");
        context.font = '24px sans-serif';

		context.fillStyle = "#99ee33";
		context.fillRect(this.x, this.y, this.width, this.height);
		context.fillStyle = "#000000";

		context.fillStyle = "#000000";
        
        if (this.upgrade.owned) {
            context.fillStyle = "#888888";
        }

		context.fillText(this.upgrade.name, this.x + 10, this.y + 24);

        context.font = '18px sans-serif';

        if (this.upgrade.cost > this.game.state.totalAmount) {
            context.fillStyle = "#cc0000";
        }

		context.fillText("Cost: " + printNumber(this.upgrade.cost), this.x + 10, this.y + 24 + 24);
        
        if (this.upgrade.requiresItem) {
            // const item = items.find(i => i.name === this.upgrade.requiresItem);
            context.fillStyle = "#000000";

            if (!this.game.fullfillsUpgradeRequirements(this.upgrade)) {
                context.fillStyle = "#cc0000";
            }

            context.fillText("Req: " + printNumber(this.upgrade.requiresCount) + " " + this.upgrade.requiresItem, this.x + 10 + this.width / 2, this.y + 24 + 24);
        }

        /*if (this.upgrade.requiresItem) {
            const item = items.find(i => i.name === itemName);
            if (!item) {
                throw new Error('Require upgrade not exist ' + itemName);
            }
                
            const requiresCount = upgrade.requires[itemName];
            if (item.owned < requiresCount) {
                console.log("You need " + requiresCount + " " + itemName + " to buy this");
                return false;
            }
        }*/

        // Requires: 100 City
        // Boosts: City 2x
    }
    
    click(e) {
        
        if (!this.game.state.buyUpgrade(this.upgrade)) {
            return ;
        }

        // Quick way to lay out upgrades again
        this.game.initGameScreen();
    }
}

class TopBar extends RenderObject {
    constructor(game, x, y, width, height, item) {
        super(x, y, width, height);
        this.game = game;
        this.item = item;
        this.modifiers.push({ self: game, name: 'totalAmount'});
    }
    
    draw() {
        var context = this.game.canvas.getContext("2d");
        context.font = '24px sans-serif';
        context.fillStyle = "#ccee88";
        context.fillRect(this.x, this.y, this.width, this.height);
        context.fillStyle = "#000000";
        context.fillText("$ " + this.game.state.totalAmount.toFixed(2), this.x + 2, this.y + 24);

    }
}


class ProgressBar extends RenderObject {
    constructor(game, x, y, width, height, item) {
        super(x, y, width, height);
        this.game = game;
        this.item = item;
    }
    
    draw() {
        var context = this.game.canvas.getContext("2d");
        context.font = '24px sans-serif';
        context.fillStyle = "#ccee88";
        context.fillRect(this.x, this.y, this.width, this.height);
        context.fillStyle = "#000000";
        context.fillText("Progress..", this.x + 2, this.y + 24);

    }
}

class Background extends RenderObject {
    constructor(game) {
        super(0, 0, game.canvas.width, game.canvas.height);
        this.game = game;
    }
    
    getImage() {
        if (this.game.state.items[3].owned > 0) {
            return this.game.cityImage;
        }

        if (this.game.state.items[2].owned > 0) {
            return this.game.galaxyImage;
        }

        if (this.game.state.items[1].owned > 0) {
            return this.game.planetImage;
        }

        return this.game.cityImage;
    }
    
    draw() {
        var context = this.game.canvas.getContext("2d");
        const img = this.getImage(); // this.game.planetImage;
        // let w = img.width;
        // let h = img.height;
        let w = this.game.canvas.width;
        let h = this.game.canvas.height;
        
        let a = 1;
        // if (canvas.width > img.width) {
            a = this.game.canvas.width / img.width;
        // }
        
        if (this.game.canvas.height > img.height * a) {
            a = this.game.canvas.height / img.height;
        }
        

        // const a = w / h;
        
        w = img.width * a;
        h = img.height * a;
        // console.log("BG", w, h);

        context.drawImage(img, 0, 0, w, h)

    }
}

export class Game extends Scene {
    constructor(canvas) {
        super(canvas);
        // this.canvas = canvas;
        this.state = new GameState();
        // this.totalAmount = 1;
        this.background = new Background(this);
        // this.renderItems = [];
        
        this.loadAssets(); // async
        this.initLoadingScreen();
        // this.initGameScreen();
        
        // this.startTime = Date.now();
        // // this.currentTime = 0;
        // setInterval(() => this.tick(), 100);
    }
    
    initLoadingScreen() {
        this.renderItems = [];
        this.renderItems.push(new ProgressBar(this, 0, 0, this.canvas.width, this.canvas.height));
        // just a progressbar, or nothing, while loading assets
    }
    
    async loadAssets() {
        this.cityImage = await loadImageAsync("pedro-lastra-Nyvq2juw4_o-unsplash.jpg");
        this.planetImage = await loadImageAsync("nasa-Q1p7bh3SHj8-unsplash.jpg");
        this.galaxyImage = await loadImageAsync("graham-holtshausen-fUnfEz3VLv4-unsplash.jpg");
        this.initGameScreen();
    }
    
    initGameScreen() {
        this.renderItems = [];
        let y = 0;
        this.renderItems.push(this.background);
        
        // push menubar total money
        this.renderItems.push(new TopBar(this, 0, 0, 600, 50));

        const halfWidth = this.canvas.width / 2;

        // let perSec = 0;
        for (let item of this.state.items) {
            this.renderItems.push(new ItemButton(this, halfWidth - 300 + 5, y + 70, 290, 48 + 12, item));
            
            y += 48 + 12 + 5;
            
            // perSec += getItemIncome(item) / item.baseTime * 1000;

        }
        
        // show relevant upgrades, dont show bought
        y = 0;
        for (let upgrade of this.state.upgrades) {
            if (upgrade.owned) {
                continue;
            }
            
            // hvis item cost er mindre enn X money per second
            // nei - hva: hvis req count er oppnåelig i en livstid?
            
            // const costUntilNextUpgrade = getItemsCost(item, upgrade.requiredCount);
            const item = this.state.items.find(i => i.name === upgrade.requiresItem);
            // const costUntilNextUpgrade = getItemsCost(item, upgrade.requiresCount);
            
            // const perHour = perSec * 60 * 60;
            if (item.owned < upgrade.requiresCount) { // costUntilNextUpgrade > perHour * 2) {
                // console.log("its more", costUntilNextUpgrade, perHour);
                continue;
            }

            this.renderItems.push(new UpgradeButton(this, halfWidth + 5, y + 70, 290, 48 + 12, upgrade));
            
            y += 48 + 12 + 5;
        }
    }
        
    initUpgradeScreen() {
        // TODO: separate screen, button to switch main/upgrades
        this.renderItems = [];
        let y = 0;
        
        // push menubar total money
        this.renderItems.push(new TopBar(this, 10, 10, 600, 50));

        // select relevant upgrades, dont show bought
        
        for (let upgrade of this.state.upgrades) {
            if (upgrade.owned) {
                continue;
            }

            this.renderItems.push(new UpgradeButton(this, 10, y + 70, 300, 48 + 12, upgrade));
            
            y += 48 + 12 + 5;
        }

    }
    
    fullfillsUpgradeRequirements(upgrade) {
        if (upgrade.requiresItem) {
            const item = this.state.items.find(i => i.name === upgrade.requiresItem);
            if (!item) {
                throw new Error('Require upgrade not exist ' + upgrade.requiresItem);
            }
            
            if (item.owned < upgrade.requiresCount) {
                // console.log("You need " + upgrade.requiresCount + " " + upgrade.requiresItem + " to buy this");
                return false;
            }
        }
        
        return true;
    }

    tick() {
        const t = Date.now();
        
        this.state.tick(t);
    }
}