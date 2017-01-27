import {singleObject} from "./singleObject";

let pass = 0;
let fail = 0;

const tests = [
    singleObject,
];

run();

function run() {
    for(let test of tests) {
        try {
            test();

            ++pass;
        }
        catch(err) {
            console.error(err);

            ++fail;
        }
    }

    console.log(`${pass} of out ${pass+fail}`);
}
