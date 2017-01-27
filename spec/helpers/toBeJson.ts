beforeEach(function () {
    jasmine.addMatchers({
        toBeJson: function () {
            return {
                compare: function (actual) {
                    try {
                        JSON.stringify(actual);

                        return {
                            pass: true,
                        }
                    }
                    catch (err) {
                        return {
                            pass: false,
                        }
                    }
                }
            };
        }
    });
});
