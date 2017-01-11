import {StringBuilder} from "../common/StringBuilder";
import {isDigit} from "../common/helpers";
import {SerializerStream} from "./Stream";

export class StringStream implements SerializerStream {
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

    readArrayElement(index: number): boolean {
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

    readTypeId(): string {
        const ch1 = this.str[this.index];
        const ch2 = this.str[this.index + 1];
        const ch3 = this.str[this.index + 2];

        if(ch1=="\"" && ch2=="$" && ch3=="$") {
            return "REF";
        }
        else if(ch1=="\"") {
            return "STR";
        }
        else if(ch1=="{") {
            return "OBJ";
        }
        else if(isDigit(ch1)) {
            return "NUM";
        }
        else {
            throw new Error(`Failed to detect typeId at position ${this.index}`);
        }
    }

    readString(): string {
        this.ensureChar("\"");

        const res = this.readStringUntil("\"", [undefined]);
        return res;
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

            if (ch == "]" || ch == "}" || ch == ",") {
                break;
            }

            throw new Error(`Unexpected character ${ch} at position ${this.index}`);
        }

        const str = res.join();
        const num: number = parseFloat(str);
        return num;
    }

    readFieldBegin(index: number): string {
        const name = this.readStringUntil(":", ["{", "}", "[", "]", undefined]);
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

    writeArrayElement(index: number) {
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
        this.buffer.append(name + ":");
    }

    writeFieldEnd(name: string) {
    }

    writeObjectBegin(obj) {
        this.buffer.append("{");
    }

    writeObjectEnd() {
        this.buffer.append("}");
    }

    writeTypeId(typeId: string) {
    }

    readReference(): number {
        this.ensureChar("\"");
        this.ensureChar("$");
        this.ensureChar("$");

        const str = this.readStringUntil("\"", [], ["0","1","2","3","4","5","6","7","8","9"]);
        const objId = parseInt(str);

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

    get() {
        return this.buffer.build();
    }
}
