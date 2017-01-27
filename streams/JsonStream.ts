import {StringBuilder} from "../common/StringBuilder";
import {isDigit} from "../common/helpers";
import {SerializationStream, TypeId, ObjId} from "./Stream";

export class JsonStream implements SerializationStream {
    private str: string;
    private index: number;

    private buffer: StringBuilder;

    constructor(str?: string) {
        this.str = str;
        this.buffer = new StringBuilder();
        this.index = 0;
    }

    private ensureChar(expected): string {
        const ch = this.readChar();
        if (ch != expected) {
            throw new Error(`Unexpected character ${ch} at position ${this.index}. Expecting ${expected}`);
        }

        return ch;
    }

    private readChar(): string {
        const ch = this.str[this.index++];
        return ch;
    }

    readArrayBegin() {
        this.ensureChar("[");
    }

    private peekChar() {
        return this.str[this.index];
    }

    readArrayNext(index: number): boolean {
        const ch = this.peekChar();
        if(ch == "]") {
            return false;
        }
        else if(ch===undefined) {
            this.unexpected(undefined, this.index);
        }

        if(index == 0) {
            return true;
        }

        this.ensureChar(",");

        return true;
    }

    readArrayEnd() {
        this.ensureChar("]");
    }

    private unexpected(ch, index): never {
        throw new Error(`Unexpected character ${ch} at position ${index}`);
    }

    private readToken(token: string) {
        let index = 0;
        while (index < token.length) {
            let ch = this.str[this.index++];
            if(ch != token[index++]) {
                this.unexpected(ch, index)
            }
        }
    }

    private readStringUntil(end: string, unexpected?: any[], allowed?: any[]): string {
        const res = new StringBuilder();
        while (true) {
            let index = this.index++;
            let ch = this.str[index];
            if (ch == end) {
                break;
            }

            if(unexpected && unexpected.indexOf(ch)!=-1) {
                this.unexpected(ch, index)
            }

            if(allowed && allowed.indexOf(ch)==-1) {
                this.unexpected(ch, index)
            }

            res.append(ch);
        }

        const str = res.build();
        return str;
    }

    readTypeId(): TypeId {
        const ch1 = this.str[this.index];
        const ch2 = this.str[this.index + 1];
        const ch3 = this.str[this.index + 2];
        const ch4 = this.str[this.index + 3];
        const ch5 = this.str[this.index + 4];

        if(ch1=="\"" && ch2=="$" && ch3=="$") {
            return TypeId.REF;
        }
        else if(ch1=="\"") {
            return TypeId.STR;
        }
        else if(ch1=="{") {
            if(ch2=="\"" && ch3=="$" && ch4=="$" && ch5=="u") {
                return TypeId.UNDEFINED;
            }

            return TypeId.OBJ;
        }
        else if(ch1=="[") {
            return TypeId.ARR;
        }
        else if(ch1=="n" && ch2=="u") {
            return TypeId.NULL;
        }
        else if(ch1=="t" || ch1=="f") {
            return TypeId.BOOL;
        }
        else if(isDigit(ch1)) {
            return TypeId.NUM;
        }
        else {
            throw new Error(`Failed to detect typeId at position ${this.index} ${ch1}${ch2}`);
        }
    }

    readString(): string {
        this.ensureChar("\"");

        const res = this.readStringUntil("\"", [undefined]);
        return res;
    }

    readBoolean(): boolean {
        const ch = this.readChar();
        if(ch == "t") {
            this.ensureChar("r");
            this.ensureChar("u");
            this.ensureChar("e");
            return true;
        }
        else if(ch == "f") {
            this.ensureChar("a");
            this.ensureChar("l");
            this.ensureChar("s");
            this.ensureChar("e");
            return false;
        }
        else {
            throw new Error("Invalid boolean value first character: " + ch);
        }
    }

    readNull() {
        this.readToken("null");

        return null;
    }

    readUndefined() {
        this.readToken(`{"$$undefined": 1}`);

        return undefined;
    }

    readNumber(): number {
        let dotSeen = false;
        const res = [];
        while (true) {
            let ch = this.str[this.index];
            if (isDigit(ch)) {
                res.push(ch);

                ++this.index;
                continue;
            }

            if (ch == ".") {
                if (dotSeen) {
                    throw new Error(`Unexpected character ${ch} at position ${this.index}`);
                }

                res.push(".");
                dotSeen = true;

                ++this.index;
                continue;
            }

            break;
        }

        const str = res.join("");
        const num: number = parseFloat(str);
        return num;
    }

    readFieldBegin(index: number): string {
        this.ensureChar("\"");
        const name = this.readStringUntil("\"", ["{", "}", "[", "]", undefined]);
        this.ensureChar(":");
        return name;
    }

    readFieldEnd(index: number) {
    }

    readObjectBegin() {
        this.ensureChar("{");
    }

    readObjectEnd() {
        this.ensureChar("}");
    }

    writeArrayBegin() {
        this.buffer.append("[");
    }

    writeArrayNext(index: number) {
        if(index > 0) {
            this.buffer.append(",");
        }
    }

    writeArrayEnd() {
        this.buffer.append("]");
    }

    readFieldNext(index: number): boolean {
        const ch = this.str[this.index];
        if(ch == "}") {
            return false;
        }

        if(ch==",") {
            if(index>0) {
                ++this.index;
                return true;
            }
        }

        if(index==0) {
            return true;
        }

        this.unexpected(ch, this.index);
    }

    writeFieldNext(index: number) {
        if(index>0) {
            this.buffer.append(",");
        }
    }

    writeFieldBegin(name: string, index: number) {
        if(index>0) {
            this.buffer.append(",");
        }
        this.buffer.append("\"" + name + "\":");
    }

    writeFieldEnd(name: string) {
    }

    writeObjectBegin(obj) {
        this.buffer.append("{");
    }

    writeObjectEnd() {
        this.buffer.append("}");
    }

    writeTypeId(typeId: TypeId) {
    }

    readReference(): number {
        this.ensureChar("\"");
        this.ensureChar("$");
        this.ensureChar("$");

        const objId = this.readNumber();
        this.ensureChar("\"");
        return objId;
    }

    writeReference(objId: number) {
        this.buffer.append("\"$$" + objId.toString() + "\"");
    }

    writeString(str: string) {
        this.buffer.append("\"" + str + "\"");
    }

    writeNumber(num: number) {
        this.buffer.append(num.toString());
    }

    writeBoolean(val: boolean) {
        this.writeLiteral(val);
    }

    writeNull() {
        this.writeLiteral(null);
    }

    writeUndefined() {
        this.writeLiteral(`{"$$undefined": 1}`);
    }

    private writeLiteral(val: any) {
        this.buffer.append(val + "");
    }

    get() {
        return this.buffer.build();
    }
}
