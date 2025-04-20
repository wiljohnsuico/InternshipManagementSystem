const express = require('express');
const app = express();
const PORT = 5004;

app.get('/test', (req, res) => {
    console.log('✅ Test route hit!');
    res.json({ message: 'Test route working!' });
});

app.listen(PORT, () => {
    console.log(`✅ Test server is running on port ${PORT}`);
});
