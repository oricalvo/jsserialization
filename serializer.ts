import {StringBuilder} from "./StringBuilder";
export class Serializer {
    private stack;
    private map;
    private nextObjId: number;

    constructor() {
        this.stack = [];
        this.map = new Map();
        this.nextObjId = 1;
    }

    private generateObjId(): number {
        return this.nextObjId++;
    }

    registerType(typeId: string, ctor: Function) {
    }

    serialize(obj, stream: Stream) {
        this.writeObject(stream, obj);
    }

    private getTypeId(obj) {
        const type = typeof obj;
        if(type == "string") {
            return "STR";
        }
        else if(type == "number") {
            return "NUM";
        }
        if(type == "object") {
            return "OBJ";
        }
    }

    private writeObject(stream: Stream, obj) {
        this.stack.push({obj: obj, fieldCount: 0});

        const typeId = this.getTypeId(obj);

        if(typeId == "STR") {
            stream.writeString(obj);
        }
        else if(typeId == "NUM") {
            stream.writeNumber(obj);
        }
        if(typeId == "OBJ") {
            let objId = this.map.get(obj);
            if(objId !== undefined) {
                stream.writeString("$$" + objId);
                return;
            }

            objId = this.generateObjId();
            this.map.set(obj, objId);

            stream.writeObjectBegin(obj);

            let index = 0;
            stream.writeFieldBegin("$$id", index);
            stream.writeNumber(objId);
            stream.writeFieldEnd("$$id", index);

            for(let key in obj) {
                stream.writeFieldBegin(key, ++index);

                this.writeObject(stream, obj[key]);

                stream.writeFieldEnd(key, index);
            }

            stream.writeObjectEnd();
        }

        this.stack.pop();
    }
}

export interface Stream {
    writeString(str: string);
    writeNumber(num: number);

    writeFieldBegin(name: string, index: number);
    writeFieldEnd(name: string, index: number);

    writeObjectBegin(obj);
    writeObjectEnd();
}

export class ConsoleStream {
    constructor() {
    }

    writeFieldBegin(name: string, index: number) {
        if(index>0) {
            console.log(",");
        }

        console.log(name + ":");
    }

    writeFieldEnd(name: string, index: number) {
    }

    writeObjectBegin(obj) {
        console.log("{");
    }

    writeObjectEnd() {
        console.log("}");
    }

    writeString(str: string) {
        console.log("\"" + str + "\"");
    }

    writeNumber(num: number) {
        console.log(num);
    }
}

export class StringStream {
    private buffer: StringBuilder;

    constructor() {
        this.buffer = new StringBuilder();
    }

    writeFieldBegin(name: string, index: number) {
        if(index>0) {
            this.buffer.append(",");
        }

        this.buffer.append(name + ":");
    }

    writeFieldEnd(name: string, index: number) {
    }

    writeObjectBegin(obj) {
        this.buffer.append("{");
    }

    writeObjectEnd() {
        this.buffer.append("}");
    }

    writeString(str: string) {
        this.buffer.append("\"" + str + "\"");
    }

    writeNumber(num: number) {
        this.buffer.append(num + "");
    }

    get() {
        return this.buffer.build();
    }
}