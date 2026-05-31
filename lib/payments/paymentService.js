async function createPaymentIntent() {
    return {
        status: "not_configured",
        paymentMode: "online_placeholder",
        provider: null
    };
}

async function confirmPayment() {
    return {
        status: "not_configured",
        paymentStatus: "pending"
    };
}

async function refundPayment() {
    return {
        status: "not_configured",
        refundStatus: "manual_placeholder"
    };
}

module.exports = {
    createPaymentIntent,
    confirmPayment,
    refundPayment
};
