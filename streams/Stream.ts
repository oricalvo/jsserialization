export interface SerializerStream {
    readString(): string;
    readNumber(): number;
    readTypeId(): string;
    readReference(): number;

    readBegin();
    readNext(index: number): boolean;
    readEnd();

    readFieldNext(index: number): boolean;
    readFieldBegin(index: number): string;
    readFieldEnd(index: number);

    readObjectBegin();
    readObjectEnd();

    writeFieldNext(index: number): string;
    writeFieldBegin(name: string, index: number);
    writeFieldEnd(name: string, index: number);

    writeObjectBegin(obj);
    writeObjectEnd();

    writeString(str: string);
    writeNumber(num: number);
    writeTypeId(typeId: string);
    writeReference(objId: number);

    writeBegin();
    writeNext(index: number);
    writeEnd();

    writeFieldBegin(name: string, index: number);
    writeFieldEnd(name: string, index: number);

    writeObjectBegin(obj);
    writeObjectEnd();
}
