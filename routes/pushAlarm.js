const request = require('request');
const FCM = require('fcm-push');

function sendTopicMessage(title, content) {
    var message = {
        title: title,
        content: content
    }
    request({
        url: 'https://fcm.googleapis.com/fcm/send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': ''
        },
        body: JSON.stringify({
            "to": "",
            // "to": "",
            "data": {
                "title" : title,
                "content" : content
            },
            // "notification": {
            //     "body": "great match!",
            //     "title": "Portugal vs. Denmark",
            //     "icon": "myicon"
            // }
        })
    }, function(error, response, body) {
        if (error)                            console.error(error, response, body);
        else if (response.statusCode >= 400)  console.error('HTTP Error: ' + response.statusCode + ' - ' + response.statusMessage + '\n' + body);
        else                                  console.log('Done : ' + body);
    });
}

// function askGroup() {
//     request({
//         url: 'http://android.googleapis.com/gcm/notification',
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': '',
//             // 'project_id': 1
//         },
//         body: JSON.stringify({
//             "operation": "create",
//             "notification_key_name": "Group_Test",
//             "registration_ids": ["4", "8", "15", "16", "23", "42"]
//         })
//     }, function(err, res, body) {
//         if (err)                              console.error(err, res, body);
//         else if (res.statusCode >= 400)       console.error('HTTP Error: ' + res.statusCode + ' - ' + res.statusMessage + '\n' + body);
//         else                                  console.log('Done')
//     });
// }
module.exports = sendTopicMessage;
