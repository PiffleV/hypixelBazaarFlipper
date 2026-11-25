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
            if (itemInfo == "" || !(["A1","A2","A3","B1","B2","B3","C1","C2","C3"].includes(element))) {
                return;
            }

            [item, count] = itemInfo.split(":");
            count = parseInt(count);
            if (isNaN(count)) {
                console.log(itemInfo);
                count = 1;
            }
            if (itemRecipe[item] == undefined) {
                itemRecipe[item] = count;
            } else {
                itemRecipe[item] += count;
            }
        });
        let itemName = items[itemCount].split(".")[0]
        itemName.replace("-",":")
        itemName.replace("%3B","_")
        json[items[itemCount].split(".")[0]] = itemRecipe
    }
    console.log(json);
}