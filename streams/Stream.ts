export class TypeId {
    static OBJ = new TypeId("OBJ");
    static STR = new TypeId("STR");
    static NUM = new TypeId("NUM");
    static REF = new TypeId("REF");
    static ARR = new TypeId("ARR");
    static BOOL = new TypeId("BOOL");

    constructor(public name: string) {
    }
}

export interface SerializerStream {
    readArrayBegin();
    readArrayNext(index: number): boolean;
    readArrayEnd();

    readObjectBegin();
    readObjectEnd();

    readFieldNext(index: number): boolean;
    readFieldBegin(index: number): string;
    readFieldEnd(index: number);

    readString(): string;
    readNumber(): number;
    readBoolean(): boolean;
    readTypeId(): TypeId;
    readReference(): number;

    writeArrayBegin();
    writeArrayNext(index: number);
    writeArrayEnd();

    writeObjectBegin(obj);
    writeObjectEnd();

    writeFieldBegin(name: string, index: number);
    writeFieldEnd(name: string, index: number);

    writeString(str: string);
    writeNumber(num: number);
    writeBoolean(val: boolean);
    writeTypeId(typeId: TypeId);
    writeReference(objId: number);
}
