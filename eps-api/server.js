const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
require("dotenv").config();

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'static')));

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

const getPythonExecutablePath = () => {
    const venvPathWindows = path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe'); // Windows
    const venvPathUnix = path.join(__dirname, '..', '.venv', 'bin', 'python'); // Unix/Linux/Mac

    if (fs.existsSync(venvPathWindows)) {
        return venvPathWindows;
    } else if (fs.existsSync(venvPathUnix)) {
        return venvPathUnix;
    } else {
        throw new Error('Python executable not found in .venv');
    }
};

const runPythonScript = (scriptPath, args) => {
    return new Promise((resolve, reject) => {
        const pythonExecutable = getPythonExecutablePath();
        const pyProg = spawn(pythonExecutable, [scriptPath].concat(args));

        let data = '';
        pyProg.stdout.on('data', (stdout) => {
            data += stdout.toString('utf8'); // Usando UTF-8
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
    const { prompt, image } = req.body;

    if (!prompt && !image) {
        return res.status(400).json({ error: 'Prompt or image is required' });
    }

    try {
        console.log('Received prompt:', prompt || 'Analyze this image:');
        const scriptPath = image ? path.join(__dirname, 'imagem.py') : path.join(__dirname, 'texto.py');
        const args = image ? [prompt || 'Analyze this image:', image] : [prompt];
        const response = await runPythonScript(scriptPath, args);
        console.log('Sending response:', response);
        res.setHeader('Content-Type', 'application/json; charset=utf-8'); // Adiciona UTF-8
        res.json({ response });
    } catch (error) {
        console.error('Error in /eps endpoint:', error);
        res.status(500).json({ error: 'Failed to get response from EPS model' });
    }
});

app.get('/', (req, res) => {
    console.log('Serving index.html');
    res.sendFile(path.join(__dirname, '..', 'static', 'index.html'));
});

app.listen(port, () => {
    console.log(`EPS API server running at http://localhost:${port}`);
});