const { handleEnrichEntity } = require("../../server/enrich");
const { createRequestContext } = require("../../server/request_guard");

exports.handler = async function handler(event) {
    return handleEnrichEntity({
        method: event.httpMethod,
        body: event.body,
        context: createRequestContext(event)
    });
};
