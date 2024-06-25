const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { spawn } = require("child_process");
require("dotenv").config();

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'static')));

// Adicionando CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    next();
});

const runPythonScript = (scriptPath, args) => {
    return new Promise((resolve, reject) => {
        const venvPath = path.join(__dirname, '.venv', 'Scripts', 'python'); // Windows
        // const venvPath = path.join(__dirname, '.venv', 'bin', 'python'); // Linux/Mac
        const pyProg = spawn(venvPath, [scriptPath].concat(args));

        let data = '';
        pyProg.stdout.on('data', (stdout) => {
            data += stdout.toString();
        });

        pyProg.stderr.on('data', (stderr) => {
            console.error(`stderr: ${stderr}`);
            reject(stderr.toString());
        });

        pyProg.on('close', (code) => {
            if (code === 0) {
                resolve(data);
            } else {
                reject(`child process exited with code ${code}`);
            }
        });
    });
};

app.post('/eps', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        console.log('Received prompt:', prompt);
        const scriptPath = path.join(__dirname, 'eps-api', 'testeAPI.py');
        const response = await runPythonScript(scriptPath, [prompt]);
        console.log('Sending response:', response);
        res.json({ response });
    } catch (error) {
        console.error('Error in /eps endpoint:', error);
        res.status(500).json({ error: 'Failed to get response from EPS model' });
    }
});

app.get('/', (req, res) => {
    console.log('Serving index.html');
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.listen(port, () => {
    console.log(`EPS API server running at http://localhost:${port}`);
});