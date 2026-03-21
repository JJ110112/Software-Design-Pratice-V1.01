const http = require('https');
http.get('https://firestore.googleapis.com/v1/projects/software-design-pratice/databases/(default)/documents/scores?pageSize=300', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        if(!json.documents) return console.log('No documents found.');
        const records = json.documents.map(d => {
            const f = d.fields;
            if(!f) return null;
            return {
                user: f.userName?.stringValue,
                gameMode: f.gameMode?.stringValue,
                qID: f.qID?.stringValue,
                stars: f.stars?.integerValue || f.stars?.doubleValue
            };
        }).filter(r => r && r.user === '李亦澄' && r.gameMode === '看中文寫程式');
        console.dir(records, {depth: null});
    });
});
