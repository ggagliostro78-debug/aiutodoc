const { handleAdminLogin } = require("../../server/admin_auth");

exports.handler = async function handler(event) {
    return handleAdminLogin({
        method: event.httpMethod,
        body: event.body
    });
};
