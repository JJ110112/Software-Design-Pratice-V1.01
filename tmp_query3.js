const http = require('https');
http.get('https://firestore.googleapis.com/v1/projects/software-design-pratice/databases/(default)/documents/scores?orderBy=timestamp%20desc&pageSize=5', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        if(!json.documents) return console.log('No documents.');
        const records = json.documents.map(d => d.fields).map(f => ({
            user: f.userName?.stringValue,
            gameMode: f.gameMode?.stringValue,
            qID: f.qID?.stringValue,
            time: f.timestamp?.stringValue
        }));
        console.log(JSON.stringify(records, null, 2));
    });
});
