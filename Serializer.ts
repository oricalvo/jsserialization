import {SerializerStream, TypeId} from "./streams/Stream";

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
        stream.writeArrayBegin();

        while(this.pending.length > 0) {
            stream.writeArrayNext(index);

            const obj = this.pending.pop();
            this.writeValue(stream, obj);

            ++index;
        }

        stream.writeArrayEnd();
    }

    deserialize(stream: SerializerStream) {
        let index = 0;
        let root = null;

        stream.readArrayBegin();

        while(stream.readArrayNext(index++)) {
            const obj = this.readValue(stream);
            if(!root) {
                root = obj;
            }
        }

        for(let entry of this.pending) {
            const objId = entry.obj[entry.field];
            const obj = this.map.get(objId);
            if(obj === undefined) {
                throw new Error(`Invalid reference ${entry.ref}`);
            }

            entry.obj[entry.field] = obj;
        }

        stream.readArrayEnd();

        return root;
    }

    private getTypeId(obj): TypeId {
        const type = typeof obj;
        if(type == "string") {
            return TypeId.STR;
        }
        else if(type == "number") {
            return TypeId.NUM;
        }
        else if(Array.isArray(obj)) {
            return TypeId.ARR;
        }
        else if(type == "object") {
            return TypeId.OBJ;
        }
        else if(type == "boolean") {
            return TypeId.BOOL;
        }
        else {
            throw new Error("Unsupported object type: " + type);
        }
    }

    private currentObject() {
        let obj = this.stack[this.stack.length-1];
        if(typeof obj !== "object") {
            obj = this.stack[this.stack.length-2];
            if(typeof obj !== "object") {
                throw new Error("Failed to retrieve current object");
            }
        }

        return obj;
    }

    private currentField() {
        let obj = this.stack[this.stack.length-1];
        let type = typeof obj;
        if(type == "object") {
            obj = this.stack[this.stack.length-2];
            type = typeof obj;
            if(type !== "string" && type !== "number") {
                throw new Error("Failed to retrieve current field");
            }
        }

        return obj;
    }

    private readValue(stream: SerializerStream) {
        const typeId: TypeId = stream.readTypeId();
        if(typeId == TypeId.STR) {
            return stream.readString();
        }
        else if(typeId == TypeId.NUM) {
            return stream.readNumber();
        }
        else if(typeId == TypeId.OBJ) {
            return this.readObject(stream);
        }
        else if(typeId == TypeId.REF) {
            return this.readReference(stream);
        }
        else if(typeId == TypeId.ARR) {
            return this.readArray(stream);
        }
        else if(typeId == TypeId.BOOL) {
            return stream.readBoolean();
        }
        else {
            throw new Error(`Unexpected typeId: ${typeId.name}`);
        }
    }

    private readArray(stream: SerializerStream) {
        stream.readArrayBegin();

        let arr = [];
        let index = 0;

        this.stack.push(arr);

        try {
            while (stream.readArrayNext(index)) {
                this.stack.push(index);

                try {
                    const obj = this.readValue(stream);
                    arr.push(obj);
                }
                finally {
                    this.stack.pop();
                }

                ++index;
            }

            stream.readArrayEnd();
        }
        finally {
            this.stack.pop();
        }

        return arr;
    }

    private readReference(stream: SerializerStream) {
        const objId = stream.readReference();

        this.pending.push({
            obj: this.currentObject(),
            field: this.currentField(),
        });

        return objId;
    }

    private readObject(stream: SerializerStream) {
        stream.readObjectBegin();

        let obj = {};
        let index = 0;

        this.stack.push(obj);

        while(stream.readFieldNext(index)) {
            const name = stream.readFieldBegin(index);

            this.stack.push(name);

            const value = this.readValue(stream);

            if(name == "$$id") {
                this.map.set(value, obj);
            }
            else if(name == "$$type") {
            }
            else {
                obj[name] = value;
            }

            this.stack.pop();

            stream.readFieldEnd(index++);
        }

        this.stack.pop();

        stream.readObjectEnd();

        return obj;
    }

    private writeArray(stream: SerializerStream, arr: any[]) {
        stream.writeArrayBegin();

        for(var i=0; i<arr.length; i++) {
            const item = arr[i];
            stream.writeArrayNext(i);

            this.writeValue(stream, item);
        }

        stream.writeArrayEnd();
    }

    private writeValue(stream: SerializerStream, obj) {
        this.stack.push({obj: obj, fieldCount: 0});

        try {
            const typeId = this.getTypeId(obj);

            if (typeId == TypeId.STR) {
                stream.writeString(obj);
            }
            else if (typeId == TypeId.NUM) {
                stream.writeNumber(obj);
            }
            else if(typeId == TypeId.ARR) {
                this.writeArray(stream, obj);
            }
            else if (typeId == TypeId.OBJ) {
                this.writeObject(stream, obj);
            }
            else if (typeId == TypeId.BOOL) {
                stream.writeBoolean(obj);
            }
            else {
                throw new Error("Unsupprted typeId: " + typeId.name);
            }
        }
        finally {
            this.stack.pop();
        }
    }

    private writeObject(stream: SerializerStream, obj) {
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
        stream.writeString("Object");
        stream.writeFieldEnd("$$type", index++);

        for (let key in obj) {
            stream.writeFieldBegin(key, index);

            this.writeValue(stream, obj[key]);

            stream.writeFieldEnd(key, index++);
        }

        stream.writeObjectEnd();
    }
}
