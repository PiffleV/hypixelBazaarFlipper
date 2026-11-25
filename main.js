const craftlessOptionsDiv = document.getElementById("craftless-options");
const craftlessOptions = {factions: false, enchants: false, sortMethod: "percent", minMoving: 0};

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
        sell = costToSell["pricePerUnit"]
        buy = costToBuy["pricePerUnit"]
        rawProfit = sell - buy;
        percent = (sell/buy)*100;
        list.push({item: element, buy: buy, sell: sell, raw: rawProfit, percent: percent});
    });

    const craftlessDiv = document.getElementById("craftless");
    craftlessDiv.innerHTML = "";
    list.sort(function(a,b){return b[sortMethod] - a[sortMethod]});
    list.forEach(element => {
        const infoDiv = document.createElement("div");
        infoDiv.className = "info-div";
        craftlessDiv.appendChild(infoDiv);

        const infoHeader = document.createElement("h2");
        infoHeader.className = "info-header";
        infoHeader.innerText = element.item;
        infoDiv.append(infoHeader);

        let info = [
            `Cost to Buy (Insta-sell cost): ${element.buy}`,
            `Cost to Sell (Insta-buy cost): ${element.sell}`,
            `Raw profit: ${element.raw}`,
            `Percent profit: ${element.percent}%`
        ];
        for (let i = 0; i < info.length; i++) {
            const infoItem = document.createElement("p");
            infoItem.className = "info";
            infoDiv.append(infoItem);
            infoItem.innerText = info[i];
        }
        
    })
}

for (let i = 0; i < craftlessOptionsDiv.children.length; i++) {
    let child = craftlessOptionsDiv.children[i];
    let input = child.children[1]
    if (input.nodeName == "INPUT") {
        if (input.type == "checkbox") {
            input.addEventListener("input", element => {
                craftlessOptions[element.target.name] = element.target.checked;
                craftless(craftlessOptions);
            })
        } else if (input.type == "number") {
            input.addEventListener("input", element => {
                let value = parseInt(element.target.value);
                if (!isNaN(value)) {
                    craftlessOptions[element.target.name] = value;
                } else {
                    craftlessOptions[element.target.name] = 0;
                }
                craftless(craftlessOptions);
            })
        }
    } else if (input.nodeName == "SELECT") {
        input.addEventListener("change", element => {
            craftlessOptions[element.target.name] = element.target.options[element.target.selectedIndex].value;
            craftless(craftlessOptions);
        })
    }

}

craftless(craftlessOptions);