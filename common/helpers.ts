const ascii0 = "0".charCodeAt(0);
const ascii9 = "9".charCodeAt(0);

export function isDigit(ch: string) {
    const num = ch.charCodeAt(0);
    if(num>=ascii0 && num<=ascii9) {
        return true;
    }

    return false;
}

export function deepCompare(obj1, obj2, visited?: Map<any, any>): boolean {
    const type = typeof obj1;
    if(type != typeof obj2) {
        return false;
    }

    if(type == "object") {
        visited = visited || new Map<any, any>();
        if(visited.has(obj1)) {
            const res = visited.get(obj1)!=obj2;
            if(!res) {
                return false;
            }

            return true;
        }

        visited.set(obj1, obj2);

        if(Object.getPrototypeOf(obj1)!=Object.getPrototypeOf(obj2)) {
            return false;
        }

        for(let key of Object.keys(obj1)) {
            if(!obj2.hasOwnProperty(key)) {
                return false;
            }
        }

        for(let key of Object.keys(obj2)) {
            if(!obj1.hasOwnProperty(key)) {
                return false;
            }
        }

        for(let key of Object.keys(obj1)) {
            if(!deepCompare(obj1[key], obj2[key], visited)) {
                return false;
            }
        }
    }
    else {
        if(obj1 != obj2) {
            return false;
        }
    }

    return true;
}
