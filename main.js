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

getRecipes();

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

function format(template, variables) {
    return template.replace(/\$\{(\w+)\}/g, (_, key) => {
        return variables[key] ?? "";
    });
}

async function craftless(options = craftlessOptions) {
    bz = await getBazaar();
    list = [];
    bzProd = bz["products"];

    let sortMethod = options.sortMethod;

    Object.keys(bzProd).forEach(element => {
        bzInfo = bzProd[element];

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

        costToBuy = bzInfo["sell_summary"][0];
        costToSell = bzInfo["buy_summary"][0];

        if (costToBuy == undefined || costToSell == undefined || costToBuy == 0) {
            return;
        }

        origSell = (costToSell["pricePerUnit"] - 0.1)
        sell = origSell * 0.9875
        buy = costToBuy["pricePerUnit"] + 0.1
        rawProfit = sell - buy;
        percent = (sell/buy)*100;

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
    bz = await getBazaar();
    list = [];
    bzProd = bz["products"];

    let sortMethod = options.sortMethod;

    if (craftingRecipes == -1) {
        renderItems()
    }

    Object.keys(bzProd).forEach(element => {
        bzInfo = bzProd[element];

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

        costToSell = bzInfo["buy_summary"][0];
        if (costToSell == undefined || costToSell == 0) {
            return;
        }
        sell = (costToSell["pricePerUnit"] - 0.1) * 0.9875;
        
        itemRecipe = craftingRecipes[element];
        if (itemRecipe == undefined) {
            return;
        }
        
        itemList = {}
        itemList[element] = itemRecipe["count"]

        allInBz = true;
        while (allInBz) {
            itemRecipeString = "";
            buy = 0;
            totalSellingWeek = 0;
            let newItemList = [];

            Object.keys(itemList).forEach(item => {
                itemRecipe = craftingRecipes[item];
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

                    costToBuy = bzProd[itemInRecipe]["sell_summary"][0]
                    if (costToBuy == undefined) {
                        allInBz = false;
                        return;
                    }
                    itemCount = itemRecipe[itemInRecipe] * itemList[item];
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

            rawProfit = sell - buy;
            percent = (sell/buy)*100; 
            
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

function renderItems(list, div, info) {
    list.forEach(element => {
        const infoDiv = document.createElement("div");
        infoDiv.className = "info-div";
        div.appendChild(infoDiv);

        const infoHeader = document.createElement("h2");
        infoHeader.className = "info-header";
        infoHeader.innerText = element.item;
        infoDiv.append(infoHeader);

        for (let i = 0; i < info.length; i++) {
            const infoItem = document.createElement("p");
            infoItem.className = "info";
            infoDiv.append(infoItem);
            infoItem.innerText = format(info[i], element);
        }
        
    })
}
function inputEditor(div, options, refresh) {
    for (let i = 0; i < div.children.length; i++) {
        let child = div.children[i];
        let input = child.children[1]
        if (input.nodeName == "INPUT") {
            if (input.type == "checkbox") {
                input.addEventListener("input", element => {
                    options[element.target.name] = element.target.checked;
                    refresh();
                })
            } else if (input.type == "number") {
                input.addEventListener("input", element => {
                    let value = parseInt(element.target.value);
                    if (!isNaN(value)) {
                        options[element.target.name] = value;
                    } else {
                        options[element.target.name] = 0;
                    }
                    refresh();
                })
            }
        } else if (input.nodeName == "SELECT") {
            input.addEventListener("change", element => {
                if (element.target.options[element.target.selectedIndex].value == "") {
                    refresh();
                    return;
                }
                options[element.target.name] = element.target.options[element.target.selectedIndex].value;
                refresh();
            })
        }

    }
}

inputEditor(craftlessOptionsDiv, craftlessOptions, craftless);
inputEditor(craftingOptionsDiv, craftingOptions, crafting);

craftless();
crafting();