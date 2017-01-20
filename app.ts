import {Serializer} from "./Serializer";
import {JsonStream} from "./streams/JsonStream";
import * as lodash from "lodash";
import {ObjectFieldBag} from "./ObjectFieldBag";
import {SerializerStream} from "./streams/Stream";
import "./common/Object";
import {SerializationMetadata} from "./SerializationMetadata";

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

Point.prototype.dump = function() {
    console.log(this.x + ", " + this.y);
}

function Serializable(typeId: string){
    return function(ctor){
        SerializationMetadata.default.registerTypeId(typeId, ctor);
        return ctor;
    }
}

@Serializable("Contact")
class Contact {
    id: number;
    name: string;

    constructor(id, name){
        this.id = id;
        this.name = name;
    }

    dump(){
        console.log(this.id + ", " + this.name);
    }

    // deserialize(bag: ObjectFieldBag) {
    //     this.id = bag.get("id");
    //     this.name = bag.get("name");
    // }
    //
    // serialize(bag: ObjectFieldBag) {
    //     bag.set("id", this.id);
    //     bag.set("name", this.name);
    // }
}

//test();
run();

function run() {

    try {
        const metadata = new SerializationMetadata();
        metadata.registerTypeId("Point", Point);
        const serializer = new Serializer({
            metadata: metadata
        });

        const obj = {
            name: "Ori",
            sibling: {
                name: "Roni"
            },
            pt: new Point(5, 10),
            // nums: [1, 2, 3, {name: "Udi"}],
            // admin: true,
            // contact: new Contact(1, "Beni")
        };

        //obj.sibling["sibling"] = obj;

        const stream = new JsonStream();

        serializer.serialize(obj, stream);

        const str = stream.get();
        console.log(str);

        JSON.parse(str);

        const clone = serializer.deserialize(new JsonStream(str));

        if(!lodash.isEqual(obj, clone)) {
            throw new Error("Objects before and after are not the same");
        }

        console.log("PASS");
    }
    catch(e) {
        console.log("FAILED", e.message);
    }
}
