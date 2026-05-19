const { handleSpecialistSearch } = require("../../server/specialist_search");

exports.handler = async function handler(event) {
    return handleSpecialistSearch({
        method: event.httpMethod,
        body: event.body
    });
};
