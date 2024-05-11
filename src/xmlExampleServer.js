const express = require('express');
const app = express();
const PORT = 5111;

app.get('/data', (req, res) => {
    res.header('Content-Type', 'application/xml');
    res.send(`<items>
        <item>
            <name>Item 1</name>
            <value>Value 1</value>
        </item>
        <item>
            <name>Item 2</name>
            <value>Value 2</value>
        </item>
    </items>`);
});

app.listen(PORT, () => {
    console.log(`XML Server running at http://localhost:${PORT}`);
});

