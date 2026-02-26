const http = require('http');

http.get('http://127.0.0.1:9222/json', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const targets = JSON.parse(data);
            console.log(JSON.stringify(targets, null, 2));
        } catch (e) {
            console.error('Error parsing targets:', e);
        }
    });
}).on('error', (err) => {
    console.error('Error connecting to CDP:', err.message);
});
