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
            'Authorization': 'key=AAAACU7l7Qc:APA91bEx_u45qGBWI84YqMTadLFkXR0k7_3ZuwHb_1oy6R1XhpwfrLqvj_YHRrpr68TixPu167L4Q9D6EwaI1z3DWSfGL86v7oqIUZwWqnFFAqVyMaP3q6JZirO5lPhLQ7vKmkQpivOZyxbxNgaAexX1vf51I1wi7Q'
        },
        body: JSON.stringify({
            "to": "feq95A7nKz8:APA91bHElwZqG_fEIpeNsJR_enDe_u65QkWz7wAwpeH-2UmT_O5ASoTW4zqZ_DGS4wPpxU2xFAT2voeqqWUiCJ9KiDXSZq3txKNzKAp2R6eR4-dJshjmISwCjPMx5Oc_h4jjsYVUCiTA",
            // "to": "d0XNfnsD2Uk:APA91bF8HVnx5AJM1_Kg9v5q5ZEduZwH1ETJOPnvhQVke1nsNoMg_q1o93Ie7ZDvXDGksV5P_oeJv58r2G4cwbUiduZpN-hirKOMpXXBqX_6A605KDCHNtCDxNAGlNiJZbq7XYSKxDVn",
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
