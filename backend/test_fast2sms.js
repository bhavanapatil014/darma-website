const axios = require('axios');
require('dotenv').config();

async function testSMS() {
    const authKey = process.env.FAST2SMS_AUTH;
    if (!authKey) {
        console.log("❌ FAST2SMS_AUTH is missing in your backend/.env file.");
        console.log("If you are testing locally, you need to add it.");
        return;
    }

    console.log("Testing Fast2SMS API with route 'otp'...");

    try {
        const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
            headers: {
                'authorization': authKey
            },
            params: {
                'variables_values': '123456',
                'route': 'otp',
                'numbers': '9370561021'
            }
        });
        console.log("✅ Success! Fast2SMS Response:", response.data);
    } catch (error) {
        console.error("❌ Error sending SMS via Fast2SMS!");
        if (error.response && error.response.data) {
            console.error("Fast2SMS Response Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testSMS();
