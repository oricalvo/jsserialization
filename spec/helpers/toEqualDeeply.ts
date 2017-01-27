import {deepCompare} from "../../common/helpers";

beforeEach(function () {
    jasmine.addMatchers({
        toEqualDeeply: function () {
            return {
                compare: function (actual, expected) {
                    return {
                        pass: deepCompare(actual, expected)
                    };
                }
            };
        }
    });
});
