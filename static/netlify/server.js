const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const getPythonExecutablePath = () => {
    const venvPathWindows = path.join(__dirname, '..', '..', '.venv', 'Scripts', 'python.exe'); // Windows
    const venvPathUnix = path.join(__dirname, '..', '..', '.venv', 'bin', 'python'); // Unix

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

exports.handler = async (event, context) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            }
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed'
        };
    }

    const { prompt } = JSON.parse(event.body);

    if (!prompt) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Prompt is required' })
        };
    }

    try {
        const scriptPath = path.join(__dirname, 'texto.py'); // Certifique-se que o caminho está correto
        const response = await runPythonScript(scriptPath, [prompt]);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ response: response.trim() }) // Remover espaços extras na resposta
        };
    } catch (error) {
        console.error('Error in /eps endpoint:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to get response from EPS model' })
        };
    }
};
