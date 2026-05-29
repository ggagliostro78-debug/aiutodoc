const { handleGeminiProxy } = require("../../server/gemini_proxy");
const { createRequestContext } = require("../../server/request_guard");

exports.handler = async function handler(event) {
    return handleGeminiProxy({
        method: event.httpMethod,
        body: event.body,
        context: createRequestContext(event)
    });
};
