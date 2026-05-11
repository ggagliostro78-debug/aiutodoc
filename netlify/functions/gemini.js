const { handleGeminiProxy } = require("../../server/gemini_proxy");

exports.handler = async function handler(event) {
    return handleGeminiProxy({
        method: event.httpMethod,
        body: event.body
    });
};
