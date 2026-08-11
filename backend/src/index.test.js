import { afterAll, describe, expect, it } from 'vitest';

describe('Backend Entry Point', () => {
    let app, server;

    afterAll(() => {
        if (server) server.close();
    });

    it('should export app and server', async () => {
        const module = await import('./index.js');
        app = module.app;
        server = module.server;
        expect(app).toBeDefined();
        expect(server).toBeDefined();
    });

    it('should respond to health check endpoint', async () => {
        const module = await import('./index.js');
        app = module.app;
        server = module.server;

        const response = await new Promise((resolve) => {
            const http = require('http');
            const options = {
                hostname: 'localhost',
                port: server.address().port,
                path: '/api/health',
                method: 'GET'
            };
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
            });
            req.end();
        });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
        expect(response.body.timestamp).toBeDefined();
    });
});
