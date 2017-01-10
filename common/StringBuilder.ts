export class StringBuilder {
    private data;

    constructor() {
        this.data = [];
    }

    append(str: string) {
        this.data.push(str);
    }

    build() {
        const str = this.data.join("");
        return str;
    }
}
