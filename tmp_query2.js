const http = require('https');
http.get('https://firestore.googleapis.com/v1/projects/software-design-pratice/databases/(default)/documents/scores?pageSize=300', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        if(!json.documents) return console.log('No documents.');
        const records = json.documents.map(d => d.fields).filter(f => f && f.userName && f.userName.stringValue === '李亦澄');
        const modes = new Set(records.map(f => f.gameMode && f.gameMode.stringValue));
        console.log('User modes:', Array.from(modes));
    });
});
