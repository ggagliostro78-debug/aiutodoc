const { handlePlacesSearch } = require("../../server/places");
const { createRequestContext } = require("../../server/request_guard");

exports.handler = async function handler(event) {
    return handlePlacesSearch({
        method: event.httpMethod,
        body: event.body,
        context: createRequestContext(event)
    });
};
