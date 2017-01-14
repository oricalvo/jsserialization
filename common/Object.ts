if(!Object.values) {
    Object.values = function(obj) {
        var values = [];

        for(let key in obj) {
            values.push(obj[key]);
        }

        return values;
    }
}
