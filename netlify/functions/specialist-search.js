const { handleSpecialistSearch } = require("../../server/specialist_search");
const { createRequestContext } = require("../../server/request_guard");

exports.handler = async function handler(event) {
    return handleSpecialistSearch({
        method: event.httpMethod,
        body: event.body,
        context: createRequestContext(event)
    });
};
