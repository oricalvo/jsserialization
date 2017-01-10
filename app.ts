import {Serializer} from "./Serializer";
import {StringStream} from "./streams/StringStream";

const serializer = new Serializer();
const obj = {
    name: "Ori",
    sibling: {
        name: "Roni"
    }
};

obj.sibling["sibling"] = obj;

const stream = new StringStream();

serializer.serialize(obj, stream);

const str = stream.get();

const obj2 = serializer.deserialize(new StringStream(str));
console.log(obj2);