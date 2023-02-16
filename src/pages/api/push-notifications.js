// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
const apn = require('apn');

const options = {
    token: {
      key: '/Users/jonmittelbronn/Playground/ApplePushNotificationsFE/apntest/AuthKey_29CNC8AQDY.p8',
      keyId: '29CNC8AQDY',
      teamId: 'KFQ9J5F6GN',
    },
    production: false // Set to true if using production environment
};

const handler = (req, res) => {

    // res.status(200).json({ name: __dirname })
    const apnProvider = new apn.Provider(options);
    const deviceToken = 'sdfs67sd79g6s7g6f79g6sf6g9sf9gs7ygiyfghr'

    const notification = new apn.Notification();
    notification.alert = 'Hello, World!';

    apnProvider.send(notification, deviceToken).then((result) => {
        console.log(result);
        res.send(result);
    });

    // res.status(200).json({ name: __dirname })
}
  

export default handler;