/*

    Game designer
        - Angi hvor lang tid man må grinde for å kjøpe en oppgradering
        - Timeline over hele spillets gang:
            - 
    Output:
        - Liste over upgrades

*/

function generate(...parts) {
    // console.log(parts);
    let s = "";
    for (let part of parts) {
        const i = Math.floor(Math.random() * part.length);
        s += part[i];
    }
    
    return s.substr(0, 1).toUpperCase() + s.substr(1);
}

function generateName() {
    const v1 = [ "a", "e", "i", "o", "u" ];
    const v2 = [ "ai", "ao", "ei", "ie", "ue" ];
    const c1 = [ "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "w" ];
    const c2 = [ "bb", "ch", "ck", "dd", "ee", "ff", "gg", "pp"];
    const c2_s = [ "bl", "ch", "dr", "fl", "gl", "pl" ];

    const type = Math.floor(Math.random() * 8);
    switch (type) {
        // case 0:
            // return generate(v1, c1);
        case 0:
            return generate(c1, v1, c2);
        case 1:
            return generate(v1, c1, v1, c2);
        case 2:
            return generate(v1, c2, v1, c2, v2);
        case 3:
            return generate(c1, v1, c2, v1, c1);
        case 4:
            return generate(c2_s, v1, c2, v1, c1);
        case 5:
            return generate(c1, v2);
        case 6:
            return generate(c1, v1, c2) + " " + generate(c1, v2);
        case 7:
            return generate(c1, v1, c2) + " " + generate(c2_s, v1);
        default:
            throw new Error("Name " + type + " not implemented");
    }
    // 
    // konsonant-double (ts)
    // konsonant-single
    // vowel-double (dipthong)
    // word: one of
        // [c1] [v1]
        // [c1] [v1] [c2]
        // [v1] [c1] [v1]
        // [v1] [c2] [v1]
        // [v1] [c2] [v1] [c1]
}

function getRequires(index) {
    if (index < 0) {
        return 1;
    }

    if (index === 0) {
        return 5;
    }
    
    if (index === 1) {
        return 10;
    }
    
    return (index - 1) * 25;
}

/*

upgrades skal være slik at inntekt vs innkjøp er lineært?
    - skal være dyrt, men når det utligner blir det bra
    - finnes det noe "speed of light" = tid som basis-currency

*/

function generateUpgrades(item) { // requiresItem, power, baseCost) {
    // let cost = 10;
    const requiresItem = item.name;
    const power = item.power;
    const baseCost = item.baseCost;
    let baseIncomeMultiplier = 1;

    const baseRatio = item.baseCost / item.baseIncome;

    const result = [];
    for (let i = 0; i < 100; i++) {
        let requires = getRequires(i);
        let prevRequires = getRequires(i - 1);
        let cost = getManyCost(baseCost, power, requires); // baseCost + baseCost * Math.pow(power, requires); // Math.pow(4, i + 2);
        let previousCost = 0;
        if (i > 0) previousCost = getManyCost(baseCost, power, result[result.length - 1].requiresCount); // baseCost + baseCost * Math.pow(power, requires); // Math.pow(4, i + 2);
        // cost skal bare være for X siste, ikke ALLE siste
        cost = cost - previousCost;
        // multiplier skal bli x10 på count 100, 200, 300?
        let multiplier = 2;
        // if ((requires % 100) === 0) {

            const ixCost = getItemsCost(item, requires + 1) - getItemsCost(item, requires); // pris of 0.05 - TODO adjust multipliers
            const ixIncome = (item.baseIncome * baseIncomeMultiplier * requires) / (item.baseTime / 1000); // what we make now
            
            // const initialIncome = item.baseIncome;
            // så vi skal finne en multiplier som gjør at ixCost / ixIncome * x = baseRatio; solve for x
            
            multiplier = ixCost / (ixIncome * baseRatio); // / (item.baseTime / 1000);
            multiplier = Math.floor(multiplier);
            if (multiplier < 2) multiplier = 2;

            // console.log("For " + requires + " " + item.name + ": cost=" + ixCost + ", income=" + ixIncome + ", ratio = " + (ixCost / ixIncome) + ", baseRatio = " + baseRatio + ", multi=" + multiplier + ", new income=" + (ixIncome * multiplier));

            // const hundreds = Math.floor(requires / 100); // Math.floor(log10(requires + 1)); // = number of digits - 1

            // multiplier = 2; // 5 * (hundreds + 1); // **/ Math.pow(power, requires) / requires ; // 
        // }
        
        baseIncomeMultiplier *= multiplier;

        result.push({
            name: generateName(),
            owned: 0,
            cost: cost, // 5,
            requiresItem: requiresItem,
            requiresCount: requires, // 5,
            multiplier: {
                [requiresItem]: multiplier,
            }
        });
        
    }
    
    return result;
}

const postfixes = [ "K", "M", "B", "T", "AA", "AB", "AC", "AD", "AE", "AF" ];

export function nums(str) {
    const pi = postfixes.findIndex(pf => str.endsWith(pf));
    const pf = postfixes[pi];

    const num = parseFloat(str.substr(0, str.length - pf.length));

    return num * Math.pow(10, (pi + 1) * 3);
    
    // const num = parseInt(str.substr(0, str.length - 2));
    throw new Error("TODO");
}

function log10(val) {
    return Math.log(val) / Math.LN10;
}

export function printNumber(n) {
    const pows = Math.floor(log10(n + 1)); // = number of digits - 1
    const tripows = Math.floor(pows / 3);
    
    if (tripows <= 0) {
        return n.toFixed(2)
    }
    
    return (n / Math.pow(10, tripows * 3)).toFixed(2) + postfixes[tripows - 1];
}


/*

    if (n < 100) {
        return n.toFixed(2);
    } else if (n < 1000000) {
        return n.toFixed(0);
    } else if (n < 1000000000) {
        return (n / 1000000).toFixed(2) + "M";
    } else {
        return (n / 1000000000).toFixed(2) + "B";
    }*/
    
function incomeTimeFromCps(cps, time) {
    return {
        baseIncome: cps * (time / 1000),
        baseTime: time,
    };
    // return cps / time;
}

export const items = [
	{
		name : "City",
		owned : 0,
        power: 1.07,
		baseCost : 1,
		...incomeTimeFromCps(0.05, 500),
        // baseIncome : 0.02,
		// baseTime : 1000,
        baseIncomeMultiplier: 1,
		startTime : null
	},
	{
		name : "Continent",
		owned : 0,
        power: 1.07,
		baseCost: 50,
        ...incomeTimeFromCps(1, 2000),
		// baseIncome: 1,
		// baseTime: 2000,
        baseIncomeMultiplier: 1,
		startTime : null
	},
	{
		name : "Planet",
		owned : 0,
        power: 1.09,
		baseCost: 1000,
        ...incomeTimeFromCps(10, 2000),
		// baseIncome: 10,
		// baseTime: 2000,
        baseIncomeMultiplier: 1,
		startTime : null
	},
	{
		name : "Solar System",
		owned : 0,
        power: 1.10,
		baseCost : nums("10K"), // 10000000,
        ...incomeTimeFromCps(100, 10000),
		// baseIncome : nums("1M"), //1000000,
		// baseTime : 10000,
        baseIncomeMultiplier: 1,
		startTime : null
	},
	{
		name : "Solar Neighborhood",
		owned : 0,
        power: 1.13,
		baseCost : nums("100M"), //100000000,
		baseIncome : nums("10M"), // 10 000 000,
		baseTime : 30000,
        baseIncomeMultiplier: 1,
		startTime : null
	},
	{
		name : "Galaxy",
		owned : 0,
        power: 1.15,
		baseCost : nums("500M"), // 400000000,
		baseIncome : nums("100M"), // 100 000 000,
		baseTime : 50000,
        baseIncomeMultiplier: 1,
		startTime : null
	},
	{
		name : "Galaxy Cluster",
		owned : 0,
        power: 1.12,
		baseCost : nums("15B"),
		baseIncome : nums("1.5B"),
		baseTime : 60000,
        baseIncomeMultiplier: 1,
		startTime : null
	},
	{
		name : "Observable Universe",
		owned : 0,
        power: 1.11,
		baseCost : nums("20T"),
		baseIncome : nums("1T"), // 1 000 000 000,
		baseTime : 10000,
        baseIncomeMultiplier: 1,
		startTime : null
	},
	{
		name : "Entire Multiverse",
		owned : 0,
        power: 1.14,
		baseCost : nums("10AA"),
		baseIncome : nums("3AA"),
		baseTime : 40000,
        baseIncomeMultiplier: 1,
		startTime : null
	},

];

export const upgrades = items.map(i => generateUpgrades(i)).flat();

/*export const upgrades2 = [
    ...generateUpgrades("City", 1.07, 1),
    ...generateUpgrades("Planet", 1.09, 15000),
    ...generateUpgrades("Solar System", 1.10, 10000000),
    ...generateUpgrades("Galaxy", 1.13, 100000000),
    ...generateUpgrades("Galaxy Cluster", 1.15, 400000000),
];*/

export class GameState {
    constructor() {
        this.totalAmount = 1;
        this.currentTime = 0;
        this.items = items;
        this.upgrades = upgrades;
    }
    
    buyItem(item) {
        const cost = getItemCost(item);
        if (this.totalAmount < cost) {
            return false;
        }
        
        this.totalAmount -= cost;
        item.owned++;
        if (item.startTime == null) {
            item.startTime = this.currentTime; // previousTime;
        }

        return true;
    }
    
    buyUpgrade(upgrade) {
        if (upgrade.owned) {
            console.log("Already purchased this upgrade");
            return false;
        }

        const cost = upgrade.cost;
        if (this.totalAmount < cost) {
            console.log("Cant afford this upgrade");
            return false;
        }
        
        if (!this.fullfillsUpgradeRequirements(upgrade)) {
            console.log("Dont meet the requirements of this upgrade");
            return false;
        }

        this.totalAmount -= cost;
        upgrade.owned = 1;
        
        // apply upgrades
        if (upgrade.multiplier) {
            for (let itemName in upgrade.multiplier) {
                const item = this.items.find(i => i.name === itemName);
                if (!item) {
                    console.error('Multiplier upgrade not exist ' + itemName);
                    continue;
                }
                
                item.baseIncomeMultiplier *= upgrade.multiplier[itemName];

                console.log("apply multiplier to " + item.name + ", new value = " + item.baseIncomeMultiplier);
                // remove and 
            }
        }
        
        return true;
    }
    
    fullfillsUpgradeRequirements(upgrade) {
        if (upgrade.requiresItem) {
            const item = this.items.find(i => i.name === upgrade.requiresItem);
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

    tick(currentTime) {
        this.currentTime = currentTime;
        for (var i = 0; i < this.items.length; i++) {
            var item = this.items[i];
            if (item.startTime && this.currentTime - item.startTime >= item.baseTime) {
                const turns = Math.floor((this.currentTime - item.startTime) / item.baseTime);
                // const turnTime = turns * item.baseTime;
                
                const income = getItemIncome(item) * turns;
                this.totalAmount += income; // item.baseIncome * item.baseIncomeMultiplier * item.owned * turns;
                item.startTime = this.currentTime;
            }
        }

    }
}

export function getItemCost(item) {
	// return item.baseCost + Math.pow(item.power, item.owned) - 1;
	return item.baseCost * Math.pow(item.power, item.owned);
	// return item.baseCost * Math.pow(1.07, item.owned);
}

export function getItemIncome(item) {
    return item.baseIncome * item.baseIncomeMultiplier * item.owned;
}

export function getItemsCost(item, count) {
    // https://math.stackexchange.com/a/1586921
    return item.baseCost * (Math.pow(item.power, count) - 1) / (item.power - 1);
}

export function getManyCost(baseCost, power, count) {
    // https://math.stackexchange.com/a/1586921
    return baseCost * (Math.pow(power, count) - 1) / (power - 1);
}

export function tick(currentTime) {
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item.startTime && this.currentTime - item.startTime >= item.baseTime) {
            const turns = Math.floor((this.currentTime - item.startTime) / item.baseTime);
            // const turnTime = turns * item.baseTime;
            
            const income = getItemIncome(item) * turns;
            this.totalAmount += income; // item.baseIncome * item.baseIncomeMultiplier * item.owned * turns;
            item.startTime = this.currentTime;
        }
    }

}