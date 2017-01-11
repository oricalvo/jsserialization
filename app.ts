import {Serializer} from "./Serializer";
import {JsonStream} from "./streams/JsonStream";
import * as lodash from "lodash";

run();

function run() {
    try {
        const serializer = new Serializer();
        const obj = {
            name: "Ori",
            sibling: {
                name: "Roni"
            },
            nums: [1, 2, 3, {name: "Udi"}],
            admin: true,
        };

        obj.sibling["sibling"] = obj;

        console.log(obj);

        const stream = new JsonStream();

        serializer.serialize(obj, stream);

        const str = stream.get();
        console.log(str);

        JSON.parse(str);

        const clone = serializer.deserialize(new JsonStream(str));
        console.log(clone);

        console.log("PASS");
    }
    catch(e) {
        console.log("FAILED", e.message);
    }
}
