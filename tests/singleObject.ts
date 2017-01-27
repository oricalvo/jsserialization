import {Serializer} from "../Serializer";
import {JsonStream} from "../streams/JsonStream";
import "../common/Object";
import {deepCompare} from "../common/helpers";

export function singleObject() {
    const serializer = new Serializer();

    const obj = {
        id: 123,
        name: "Ori",
        isAdmin: true,
        parent: null,
        sibling: undefined,
    };

    const stream = new JsonStream();

    serializer.serialize(obj, stream);

    const str = stream.get();

    console.log(str);
    JSON.parse(str);

    const clone = serializer.deserialize(new JsonStream(str));

    if(!deepCompare(obj, clone)) {
        throw new Error("Objects before and after are not the same");
    }
}
