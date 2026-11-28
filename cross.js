function format(template, variables) {
    return template.replace(/\$\{(\w+)\}/g, (_, key) => {
        return variables[key] ?? "";
    });
}

export function renderItems(list, div, info) {
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
export function inputEditor(div, options, refresh) {
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
