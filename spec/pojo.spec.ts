import {Serializer} from "../Serializer";
import {JsonStream} from "../streams/JsonStream";
import "../common/Object";

describe("Serializer", function() {
    it("serialize/deserialize primitives values", function() {
        const serializer = new Serializer();

        const obj = {
            id: 923,
            name: "Ori",
            isAdmin: true,
            parent: null,
            sibling: undefined,
        };

        const stream = new JsonStream();
        serializer.serialize(obj, stream);
        const str = stream.get();
        const clone = serializer.deserialize(new JsonStream(str));

        expect(str).toBeJson();
        expect(clone).toEqualDeeply(obj);
    });

    it("serialize/deserialize cyclic references", function() {
        const serializer = new Serializer();

        const ori = {
            name: "ori",
            sibling: null,
        };

        const roni = {
            name: "roni",
            sibling: null,
        };

        ori.sibling = roni;
        roni.sibling = ori;

        const stream = new JsonStream();
        serializer.serialize(ori, stream);
        const str = stream.get();
        const clone = serializer.deserialize(new JsonStream(str));

        expect(str).toBeJson();
        expect(clone).toEqualDeeply(ori);
    });
});
