import {SerializerStream, TypeId} from "./streams/Stream";
import {ObjectFieldBag} from "./ObjectFieldBag";
import {SerializationMetadata} from "./SerializationMetadata";

export interface SerializerOptions {
    metadata: SerializationMetadata;
}

export class Serializer {
    private stack: any[];
    private map;
    private nextObjId: number;
    private pending: any[];
    private metadata: SerializationMetadata;

    constructor(options?: SerializerOptions) {
        this.stack = [];
        this.pending = [];
        this.map = new Map();
        this.nextObjId = 1;
        this.metadata = (options && options.metadata) || SerializationMetadata.default;
    }

    private generateObjId(): number {
        return this.nextObjId++;
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

    private readNumber(stream: SerializerStream, index: number): number {
        stream.readFieldNext(index);
        stream.readFieldBegin(index);
        const num = stream.readNumber();
        stream.readFieldEnd(index++);

        return num;
    }

    private readString(stream: SerializerStream, index: number): string {
        stream.readFieldNext(index);
        stream.readFieldBegin(index);
        const str = stream.readString();
        stream.readFieldEnd(index++);

        return str;
    }

    private readObject(stream: SerializerStream) {
        stream.readObjectBegin();

        let index = 0;
        const $$id = this.readNumber(stream, index++);
        const $$type = this.readString(stream, index++);

        const ctor = this.metadata.getCtorByTypeId($$type);
        if(ctor == undefined) {
            throw new Error("Unregistered $$type " + $$type);
        }

        let obj = this.createUninitializedObject(ctor.prototype);
        if(ctor != Object && obj.deserialize) {
            obj = this.readCustomObject(stream, obj, $$id, ctor, index);
        }
        else {
            obj = this.readSimpleObject(stream, obj, $$id, index);
        }

        stream.readObjectEnd();

        return obj;
    }

    private createUninitializedObject(proto) {
        if(proto == Object.prototype){
            return {};
        }

        function _() {}
        _.prototype = proto;
        var obj = new _();
        return obj;
    }

    private readObjectFields(stream: SerializerStream, index: number): ObjectFieldBag {
        let fields = new ObjectFieldBag();

        while(stream.readFieldNext(index)) {
            const name = stream.readFieldBegin(index);

            this.stack.push(name);

            const value = this.readValue(stream);

            this.stack.pop();

            stream.readFieldEnd(index++);

            fields.add(name, value);
        }

        return fields;
    }

    private readCustomObject(stream: SerializerStream, obj: any, objId: number, ctor, index: number) {
        this.stack.push(obj);
        this.map.set(objId, obj);

        const fields: ObjectFieldBag = this.readObjectFields(stream, index);

        if(!obj.deserialize) {
            console.error("Object has no deserialize method", obj);
            throw new Error("Object has no deserialize method");
        }

        obj.deserialize(fields);

        this.stack.pop();

        return obj;
    }

    private readSimpleObject(stream: SerializerStream, obj: any, objId: number, index: number) {
        this.stack.push(obj);
        this.map.set(objId, obj);

        while(stream.readFieldNext(index)) {
            const name = stream.readFieldBegin(index);

            this.stack.push(name);

            const value = this.readValue(stream);

            obj[name] = value;

            this.stack.pop();

            stream.readFieldEnd(index++);
        }

        this.stack.pop();

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

    private getCreateObjId(obj) {
        let objId = this.map.get(obj);
        let created: boolean = false;
        if (objId === undefined) {
            objId = this.generateObjId();
            created = true;
            this.map.set(obj, objId);
        }

        return {
            objId,
            created
        };
    }

    private getObjectCtor(obj){
        const ctor = obj.constructor;
        if(!ctor){
            console.error("Object has no constructor", obj);
            throw new Error("Object has constructor");
        }

        return ctor;
    }

    private writeObject(stream: SerializerStream, obj) {
        const {objId, created} = this.getCreateObjId(obj);
        const ctor = this.getObjectCtor(obj);
        const typeId = this.metadata.getTypeIdByCtor(ctor);

        if (this.stack.length > 1) {
            if (created) {
                //
                //  This object was not serialized before. Remember to do that
                //
                this.pending.push(obj);
            }
            stream.writeReference(objId);
            return;
        }

        if (ctor != Object && obj.serialize) {
            this.writeCustomObject(stream, obj, objId, typeId);
        }
        else {
            this.writeSimpleObject(stream, obj, objId, typeId);
        }
    }

    private writeField(stream: SerializerStream, name: string, value: any, index: number) {
        stream.writeFieldBegin(name, index);
        this.writeValue(stream, value);
        stream.writeFieldEnd(name, index);
    }

    private writeSimpleObject(stream: SerializerStream, obj, objId: number, objType: string) {
        stream.writeObjectBegin(obj);

        let index = 0;
        this.writeField(stream, "$$id", objId, index++);
        this.writeField(stream, "$$type", objType, index++);

        for (let key of Object.keys(obj)) {
            stream.writeFieldBegin(key, index);

            this.writeValue(stream, obj[key]);

            stream.writeFieldEnd(key, index++);
        }

        stream.writeObjectEnd();
    }


    private writeCustomObject(stream: SerializerStream, obj, objId: number, objType: string) {
        if(!obj.serialize) {
            throw new Error("Custom object has no serialize method");
        }

        stream.writeObjectBegin(obj);

        const bag = new ObjectFieldBag();
        obj.serialize(bag);

        let index = 0;
        this.writeField(stream, "$$id", objId, index++);
        this.writeField(stream, "$$type", objType, index++);
        for(let field of bag.getAll()) {
            this.writeField(stream, field.name, field.value, index++);
        }

        stream.writeObjectEnd();
    }
}
