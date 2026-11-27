async function loadItems() {
    const response = await fetch('./items/');
    const html = await response.text();

    const json = {};
    
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const items = [...doc.querySelectorAll('a')]
        .map(a => a.getAttribute('href'))
        .filter(name => name && name.endsWith('.json'));

    for (const itemCount in items) {
        const response = await fetch(`./items/${items[itemCount]}`);
        const txt = await response.json();
        let recipes = -1;
        await txt;
        if (txt["recipe"] != undefined) {
            recipes = txt["recipe"];
        } else if (txt["recipes"] != undefined) {
            for (const object of txt["recipes"]) {
                if (object["type"] == "crafting") {
                    recipes = object;
                    break;
                } 
            }
        }
        if (recipes == -1) {
            continue;
        }
        const itemRecipe = {};
        Object.keys(recipes).forEach(element => {

            const itemInfo = recipes[element];
            if (element == "count") {
                itemRecipe["count"] = itemInfo;
            }
            if (itemInfo == "" || !(["A1","A2","A3","B1","B2","B3","C1","C2","C3"].includes(element))) {
                return;
            }

            [item, count] = itemInfo.split(":");
            count = parseInt(count);

            item = item.replace("-",":")
            item = item.replace("%3B","_")

            if (isNaN(count)) {
                count = 1;
            }
            if (itemRecipe[item] == undefined) {
                itemRecipe[item] = count;
            } else {
                itemRecipe[item] += count;
            }
        });
        if (itemRecipe["count"] == undefined) {
            itemRecipe["count"] = 1;
        }
        let itemName = items[itemCount].split(".")[0]
        itemName = itemName.replace("-",":")
        itemName = itemName.replace("%3B","_")
        json[itemName] = itemRecipe;
    }
    console.log(json);
}