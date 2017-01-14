export class ObjectFieldBag {
    private fields: {[key: string]: ObjectField};

    constructor() {
        this.fields = {};
    }

    add(name: string, value: any) {
        if(this.has(name)) {
            throw new Error("Field: " + name + " already exists");
        }

        this.fields[name] = {name: name, value: value};
    }

    set(name: string, value: any) {
        this.fields[name] = {name: name, value: value};
    }

    has(name: string): any {
        const res = !!this.fields[name];
        return res;
    }

    get(name: string): any {
        const field = this.fields[name];
        if(!field) {
            throw new Error("Field " + name + " does not exist");
        }

        return field.value;
    }

    getAll(): ObjectField[] {
        return Object.values(this.fields);
    }
}

export interface ObjectField {
    name: string;
    value: any;
}
