module.exports = {
    apps: [
        {
            name: 'swapsafe-backend',
            script: 'npm',
            args: 'start',
            cwd: './server',
            watch: false,
            env: {
                NODE_ENV: 'development',
            },
            error_file: '../backend.err.log',
            out_file: '../backend.out.log',
            time: true
        },
        {
            name: 'swapsafe-ai-engine',
            script: './venv/bin/uvicorn',
            args: 'main:app --host 0.0.0.0 --port 8001',
            cwd: './ai-engine',
            interpreter: 'none',
            watch: false,
            error_file: '../ai_engine.err.log',
            out_file: '../ai_engine.out.log',
            time: true,
            max_restarts: 10,
            min_uptime: 5000,
        }
    ]
};
