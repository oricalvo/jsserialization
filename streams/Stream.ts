export interface SerializerStream {
    readString(): string;
    readNumber(): number;
    readTypeId(): string;
    readReference(): number;

    readArrayBegin();
    readArrayElement(index: number): boolean;
    readArrayEnd();

    readFieldNext(index: number): boolean;
    readFieldBegin(index: number): string;
    readFieldEnd(index: number);

    readObjectBegin();
    readObjectEnd();

    writeFieldBegin(name: string, index: number);
    writeFieldEnd(name: string, index: number);

    writeString(str: string);
    writeNumber(num: number);
    writeTypeId(typeId: string);
    writeReference(objId: number);

    writeArrayBegin();
    writeArrayElement(index: number);
    writeArrayEnd();

    writeObjectBegin(obj);
    writeObjectEnd();
}
