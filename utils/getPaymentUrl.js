const axios = require("axios");

async function getPaymentUrl(userId){
    const data = {
        userId: userId
    };

    try {
        const response = await axios.post(`${process.env.server_url}/api/create-checkout-session`, data);
        const paymentUrl = response.data.url;
        console.log(`paymentUrl: ${paymentUrl}`);
        return paymentUrl;
    } catch (error) {
        console.log(error);
        return null;
    }
}

module.exports = getPaymentUrl;