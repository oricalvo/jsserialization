import {Serializer} from "./Serializer";
import {JsonStream} from "./streams/JsonStream";
import * as lodash from "lodash";
import {ObjectFieldBag} from "./ObjectFieldBag";
import {SerializerStream} from "./streams/Stream";
import "./common/Object";

function Point(x, y) {
    this.x = x;
    this.y = y;
}

Point.prototype.deserialize = function(bag: ObjectFieldBag) {
    this.x = bag.get("x");
    this.y = bag.get("y");
}

Point.prototype.serialize = function(bag: ObjectFieldBag) {
    bag.set("x", this.x);
    bag.set("y", this.y);
}

Point.prototype.show = function() {
    console.log(this.x + ", " + this.y);
}

//test();
run();

function run() {

    try {
        const serializer = new Serializer();
        serializer.registerType("Point", Point);

        const obj = {
            name: "Ori",
            sibling: {
                name: "Roni"
            },
            pt: new Point(5, 10),
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

        console.log(clone.pt);
        clone.pt.dump();

        console.log("PASS");
    }
    catch(e) {
        console.log("FAILED", e.message);
    }
}
