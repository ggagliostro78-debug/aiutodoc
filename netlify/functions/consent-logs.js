const { handleConsentLogs } = require("../../server/consent_logs");
const { createRequestContext } = require("../../server/request_guard");

exports.handler = async function handler(event) {
    return handleConsentLogs({
        method: event.httpMethod,
        body: event.body,
        context: createRequestContext(event)
    });
};
