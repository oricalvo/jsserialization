import {StringBuilder} from "../common/StringBuilder";

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
