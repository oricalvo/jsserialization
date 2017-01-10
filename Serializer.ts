import {StringBuilder} from "./common/StringBuilder";
import {SerializerStream} from "./streams/Stream";

export class Serializer {
    private stack: any[];
    private map;
    private nextObjId: number;
    private pending: any[];

    constructor() {
        this.stack = [];
        this.pending = [];
        this.map = new Map();
        this.nextObjId = 1;
    }

    private generateObjId(): number {
        return this.nextObjId++;
    }

    registerType(typeId: string, ctor: Function) {
    }

    serialize(obj, stream: SerializerStream) {
        this.pending.push(obj);

        let index = 0;
        stream.writeBegin();

        while(this.pending.length > 0) {
            stream.writeNext(index++);

            const obj = this.pending.pop();
            this.writeObject(stream, obj);
        }

        stream.writeEnd();
    }

    deserialize(stream: SerializerStream) {
        let index = 0;
        let root = null;
        let objects = {};

        stream.readBegin();

        while(this.pending.length > 0) {
            if(stream.readNext(index++)) {
                const obj = this.readObject(stream);
                if(!root) {
                    root = obj;
                }
                objects[obj["$$id"]] = obj;
            }
        }

        for(let entry of this.pending) {
            const value = objects[entry.ref];
            if(value === undefined) {
                throw new Error(`Invalid reference ${entry.ref}`);
            }

            entry.obj[entry.field] = value;
        }

        stream.readEnd();

        return root;
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

    private currentObject() {
        let obj = this.stack[this.stack.length-1];
        if(typeof obj !== "object") {
            obj = this.stack[this.stack.length-2];
        }

        return obj;
    }

    private currentField() {
        let obj = this.stack[this.stack.length-1];
        if(typeof obj !== "string") {
            obj = this.stack[this.stack.length-2];
        }

        return obj;
    }

    private readObject(stream: SerializerStream) {
        const typeId: string = stream.readTypeId();
        if(typeId == "STR") {
            return stream.readString();
        }
        else if(typeId == "NUM") {
            return stream.readNumber();
        }
        else if(typeId == "OBJ") {
            stream.readObjectBegin();

            let obj = {};
            let index = 0;

            this.stack.push(obj);

            while(stream.readFieldNext(index)) {
                const name = stream.readFieldBegin(index);

                this.stack.push(name);

                const value = this.readObject(stream);
                obj[name] = value;

                this.stack.pop();

                stream.readFieldEnd(index++);
            }

            this.stack.pop();

            stream.readObjectEnd();

            return obj;
        }
        else if(typeId == "REF") {
            const objId = stream.readReference();

            this.pending.push({
                obj: this.currentObject(),
                field: this.currentField(),
            });

            return objId;
        }
        else {
            throw new Error(`Unexpected typeId: ${typeId}`);
        }

    }

    private writeObject(stream: SerializerStream, obj) {
        this.stack.push({obj: obj, fieldCount: 0});

        try {
            const typeId = this.getTypeId(obj);

            if (typeId == "STR") {
                stream.writeString(obj);
            }
            else if (typeId == "NUM") {
                stream.writeNumber(obj);
            }
            if (typeId == "OBJ") {
                let objId = this.map.get(obj);
                let firstTimeSeen: boolean = false;
                if (objId === undefined) {
                    objId = this.generateObjId();
                    firstTimeSeen = true;
                    this.map.set(obj, objId);
                }

                if (this.stack.length > 1) {
                    if (firstTimeSeen) {
                        this.pending.push(obj);
                    }
                    stream.writeReference(objId);
                    return;
                }

                stream.writeObjectBegin(obj);

                let index = 0;
                stream.writeFieldBegin("$$id", index);
                stream.writeNumber(objId);
                stream.writeFieldEnd("$$id", index++);

                stream.writeFieldBegin("$$type", index);
                stream.writeString("OBEJCT");
                stream.writeFieldEnd("$$type", index++);

                for (let key in obj) {
                    stream.writeFieldBegin(key, index);

                    this.writeObject(stream, obj[key]);

                    stream.writeFieldEnd(key, index++);
                }

                stream.writeObjectEnd();
            }
        }
        finally {
            this.stack.pop();
        }
    }
}
