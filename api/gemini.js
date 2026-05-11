const { handleGeminiProxy } = require("../server/gemini_proxy");

module.exports = async function handler(req, res) {
    const result = await handleGeminiProxy({
        method: req.method,
        body: req.body
    });

    Object.entries(result.headers || {}).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    res.status(result.statusCode).send(result.body);
};
