const { handlePlacesSearch } = require("../../server/places");

exports.handler = async function handler(event) {
    return handlePlacesSearch({
        method: event.httpMethod,
        body: event.body
    });
};
