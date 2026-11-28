import { renderItems, inputEditor } from "./cross.js";
const craftlessOptionsDiv = document.getElementById("craftless-options");
const craftlessOptions = {factions: false, enchants: false, sortMethod: "percent", minMoving: 0};

const craftingOptionsDiv = document.getElementById("crafting-options");
const craftingOptions = {factions: false, enchants: false, sortMethod: "percent", minMoving: 0};

let craftingRecipes = {};

async function getRecipes() {
    const response = await fetch('crafting.json');
    if (!response.ok) {
        craftingRecipes = -1;
        return;
    }
    craftingRecipes = await response.json();
}

async function getBazaar() {
    const bazaarURL = "https://api.hypixel.net/skyblock/bazaar";
    try {
        const response = await fetch(bazaarURL);
        if (!response.ok) {
            console.log("API failed");
            return -1;
        }
        
        return await response.json();
    } catch (e) {
        console.log(e);
        return -1;
    }
}

async function craftless(options = craftlessOptions) {
    let bz = await getBazaar();
    let list = [];
    let bzProd = bz["products"];

    let sortMethod = options.sortMethod;

    Object.keys(bzProd).forEach(element => {
        let bzInfo = bzProd[element];

        if (!options.factions) {
            if (element.startsWith("FACTION")) {
                return;
            }
        }
        if (!options.enchants) {
            if (element.startsWith("ENCHANTMENT")) {
                return;
            }
        }
        if (bzInfo["quick_status"]["sellMovingWeek"] + bzInfo["quick_status"]["buyMovingWeek"] < options.minMoving) {
            return;
        }

        let costToBuy = bzInfo["sell_summary"][0];
        let costToSell = bzInfo["buy_summary"][0];

        if (costToBuy == undefined || costToSell == undefined || costToBuy == 0) {
            return;
        }

        let origSell = (costToSell["pricePerUnit"] - 0.1)
        let sell = origSell * 0.9875
        let buy = costToBuy["pricePerUnit"] + 0.1
        let rawProfit = sell - buy;
        let percent = (sell/buy)*100;

        list.push({item: element, buy: buy, instabuy: origSell, sell: sell, raw: rawProfit, percent: percent});
    });

    const craftlessDiv = document.getElementById("craftless");
    craftlessDiv.innerHTML = "";
    list.sort(function(a,b){return b[sortMethod] - a[sortMethod]});
    
    let info = [
        "Cost to Buy (Insta-sell cost): ${buy}",
        "No Tax Sell (Insta-buy Cost): ${instabuy}",
        "Taxed Sell: ${sell}",
        "Raw profit: ${raw}",
        "Percent profit: ${percent}%"
    ];

    renderItems(list, craftlessDiv, info);
}

async function crafting(options = craftingOptions) {
    let bz = await getBazaar();
    let list = [];
    let bzProd = bz["products"];

    let sortMethod = options.sortMethod;

    if (craftingRecipes == -1) {
        renderItems()
    }

    Object.keys(bzProd).forEach(element => {
        let bzInfo = bzProd[element];

        if (!options.factions) {
            if (element.startsWith("FACTION")) {
                return;
            }
        }
        if (!options.enchants) {
            if (element.startsWith("ENCHANTMENT")) {
                return;
            }
        }

        let costToSell = bzInfo["buy_summary"][0];
        if (costToSell == undefined || costToSell == 0) {
            return;
        }
        let sell = (costToSell["pricePerUnit"] - 0.1) * 0.9875;
        
        let itemRecipe = craftingRecipes[element];
        if (itemRecipe == undefined) {
            return;
        }
        
        let itemList = {}
        itemList[element] = itemRecipe["count"]

        let allInBz = true;
        while (allInBz) { // Recursive check
            let itemRecipeString = "";
            let buy = 0;
            let totalSellingWeek = 0;
            let newItemList = [];

            Object.keys(itemList).forEach(item => {
                let itemRecipe = craftingRecipes[item];
                if (itemRecipe == undefined) {
                    allInBz = false;
                }
                if (!allInBz) {
                    return;
                }
                Object.keys(itemRecipe).forEach(itemInRecipe => {

                    if (!allInBz) {
                        return;
                    }

                    if (itemInRecipe == "count") {
                        return;
                    }

                    if (!Object.keys(bzProd).includes(itemInRecipe)) {
                        allInBz = false;
                        return;
                    }

                    let costToBuy = bzProd[itemInRecipe]["sell_summary"][0]
                    if (costToBuy == undefined) {
                        allInBz = false;
                        return;
                    }

                    let itemCount = itemRecipe[itemInRecipe] * itemList[item];
                    if (newItemList[itemInRecipe] == undefined) {
                        newItemList[itemInRecipe] = itemCount;
                    } else {
                        newItemList[itemInRecipe] += itemCount;
                    }
                    buy += (costToBuy["pricePerUnit"] + 0.1) * itemCount;
                    totalSellingWeek += bzProd[itemInRecipe]["quick_status"]["sellMovingWeek"]
                });
            });

            if (!allInBz) {
                return;
            }

            totalSellingWeek /= Object.keys(itemRecipe).length;
            if (totalSellingWeek + bzInfo["quick_status"]["buyMovingWeek"] < options.minMoving) {
                return;
            }

            Object.keys(newItemList).forEach(itemInRecipe => {
                itemRecipeString += `${itemInRecipe}: ${newItemList[itemInRecipe]}\n`;
            })

            itemList = newItemList;

            let rawProfit = sell - buy;
            let percent = (sell/buy)*100; 
            
            list.push({item: element, purchaseList: itemRecipeString, buy: buy, sell: sell, raw: rawProfit, percent: percent});
        }
    });
    const craftingDiv = document.getElementById("crafting");
    craftingDiv.innerHTML = "";
    list.sort(function(a,b){return b[sortMethod] - a[sortMethod]});

    let info = [
        "List of items \n${purchaseList}",
        "Cost to Buy: ${buy}",
        "Taxed Sell: ${sell}",
        "Raw profit: ${raw}",
        "Percent profit: ${percent}%"
    ];

    renderItems(list, craftingDiv, info);
}

getRecipes();

inputEditor(craftlessOptionsDiv, craftlessOptions, craftless);
inputEditor(craftingOptionsDiv, craftingOptions, crafting);

craftless();
crafting();