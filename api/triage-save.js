const { handleTriageSave } = require("../server/triage_store");
const { createRequestContext } = require("../server/request_guard");

module.exports = async function handler(req, res) {
    const result = await handleTriageSave({
        method: req.method,
        body: req.body,
        context: createRequestContext(req)
    });

    Object.entries(result.headers || {}).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    res.status(result.statusCode).send(result.body);
};
