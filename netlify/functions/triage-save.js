const { handleTriageSave } = require("../../server/triage_store");
const { createRequestContext } = require("../../server/request_guard");

exports.handler = async function handler(event) {
    return handleTriageSave({
        method: event.httpMethod,
        body: event.body,
        context: createRequestContext(event)
    });
};
