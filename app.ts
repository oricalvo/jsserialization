import {Serializer, Stream, StringStream} from "./serializer";

const serializer = new Serializer();
const obj = {
    id: 1,
    name: "Ori",
    sibling: {
        id: 2,
        name: "Roni"
    }
};

obj.sibling["sibling"] = obj;

const stream = new StringStream();

serializer.serialize(obj, stream);

console.log(stream.get());