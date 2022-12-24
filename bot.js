require('dotenv').config();
const fs = require('fs');
const request = require('request');
const Mastodon = require('mastodon-api');

// Authorize
const domain = process.env.DOMAIN;
const M = new Mastodon({
    client_key: process.env.CLIENT_KEY,
    client_secret: process.env.CLIENT_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    timeout_ms: 60,
    api_url: domain + '/api/v1/',
  })

const listener = M.stream('streaming/user')
listener.on('message', response => {
    // console.log(response);
    if (response.event === 'notification' && response.data.type === 'mention' && response.data.account.acct === 'nicole') {    
        // fs.writeFileSync(`log/data${new Date().getTime()}.json`, JSON.stringify(response));
        const origPostId = response.data.status.in_reply_to_id;
        const origPosterId = response.data.status.in_reply_to_account_id;
        const myComment = response.data.status.content;
        let origPoster;
        let posterUrl;
        getUsername(origPosterId, function(username) {
            origPoster = username;
        });
        getOrigPost(origPostId, function(origText, url) {
            posterUrl = url;
            sendToReadwise(origText, origPoster, origPostId, myComment, posterUrl, function(result) {
                // console.log(`result: ${result}`);
            });
        })
    } else {
        console.error('Hey, either that\'s not a notification, you didn\'t mention me, or you\'re not Nicole!');
    }
});

listener.on('error', err => console.log(err))

function getOrigPost(id, callback) {
    M.get('statuses/' + id, (error, data) => {
        if (error) {
            console.error(error);
        } else {
            callback(data.content, data.account.url);
        }
    });
}

function getUsername(id, callback) {
    M.get('accounts/' + id, (error, data) => {
        if (error) {
            console.error(error);
        } else {
            callback(data.username);
        }
    });
}

function sendToReadwise(text, author, postid, comment, url, callback) {
    const options = {
        url: 'https://readwise.io/api/v2/highlights/',
        headers: {
            Authorization: `Token ${process.env.READWISE_TOKEN}`,
            contentType: 'application/json',
        },
        json: {
            'highlights': [
                {
                  'text': `${text}`,
                  'title': `Mastodon Posts from ${author}`,
                  'author': `${author}`,
                  'category': 'tweets',
                  'source_type': 'Mastodon',
                  'highlighted_at': `${new Date().getTime()}`,
                  'source_url': `${url}/${postid}`,
                  'note': `${comment}`,
                },
              ],
        }
    };
    request.post(options, (error, body) => {
        if (error) {
            console.error(error);
        } else {
            console.log(body);
            callback(body);
        }
    })
    console.log('Sent to Readwise');
}