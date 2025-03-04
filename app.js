const { certificate } = require("./lib/engine/CertificateGenerator");
const zlib = require("node:zlib");
const open = require("open");

/**
 * Fastify instance
 */

const database = require('./lib/engine/Database');
const webinterface = require("./lib/engine/WebInterface");

module.exports = {
    database
};

const { DatabaseLoader } = require("./lib/engine/DatabaseLoader");
const { logger, parse } = require("./utilities");

DatabaseLoader.setDatabase();
let cert;
if (process.platform === 'win32' || process.platform === 'win64') {
    
    const fs = require('fs');

    const clearCertificateScriptPath = `${__dirname}/scripts/clear-certificate.ps1`;
    const execSync = require('child_process').execSync;
    let code = execSync(`powershell.exe -ExecutionPolicy Bypass -File "${clearCertificateScriptPath}"`);
    
    cert = certificate.generate(database.core.serverConfig.ip, database.core.serverConfig.hostname, 3);

    const installCertificateScriptPath = `${__dirname}/scripts/install-certificate.ps1`;
    const installCertificateScript = fs.readFileSync(installCertificateScriptPath);
    let spawn = require('child_process').spawn;
    let installCertificatePowerShell = spawn('powershell', [installCertificateScript]);

    let userCancelOrError = false;
    // Redirect stdout and stderr to our script output.
    let installCertificateScriptOutput = "";
    installCertificatePowerShell.stdout.setEncoding('utf8');
    installCertificatePowerShell.stdout.on('data', function (data) {
        data = data.toString();
        installCertificateScriptOutput += data;
    });

    installCertificatePowerShell.stderr.setEncoding('utf8');
    installCertificatePowerShell.stderr.on('data', function (data) {
        data = data.toString();
        installCertificateScriptOutput += data;
        userCancelOrError = true;
    });

    installCertificatePowerShell.on('close', function (_code) {
        if(userCancelOrError) {
            logger.logError(`Unable to install the certificate. Error occured or user canceled the installation.`)
            logger.logError(`The certificate is required for Websockets to work, otherwise the tarkov client will not connect to the socket endpoint.`)
            logger.logError(`If you have any security concerns, you can take a look at the script ${installCertificateScriptPath}. The certificate lifetime is 3 days.`)
            logger.logError(`The certificate is generated on first start and will be saved to /user/certs/.`)
            //logger.logDebug(scriptOutput);
        } else {
            //open(`https://${database.core.serverConfig.ip}:${database.core.serverConfig.port}`) Opens the weblauncher automatically if wanted.
        }
    });
} else {
    cert = certificate.generate(database.core.serverConfig.ip, database.core.serverConfig.hostname, 365);
}

const app = require('fastify')({
    logger: {
        transport: {
            target: 'pino-pretty'
        },
        serializers: {
            res(reply) {
                return {
                    statusCode: reply.statusCode
                };
            },
            req(request) {
                return {
                    method: request.method,
                    url: request.url,
                    headers: request.headers,
                    params: request.params,
                    body: request.body,
                    query: request.query,
                    hostname: request.hostname,
                    remoteAddress: request.ip,
                    remotePort: request.socket.remotePort,
                    routerMethod: request.routerMethod,
                    routerPath: request.routerPath
                };
            }
        }
    },
    //http2: true,
    https: {
        allowHTTP1: true,
        key: cert.key,
        cert: cert.cert
    }
});

module.exports = {
    app,
    database,
    webinterface
};

app.removeContentTypeParser("application/json");
app.addContentTypeParser('application/json', { parseAs: 'buffer' }, function (req, body, done) {
    if (req.headers["user-agent"] !== undefined && req.headers['user-agent'].includes(['UnityPlayer' || 'Unity'])) {
        try {
            zlib.inflate(body, function (err, data) {
                if (!err && data !== undefined) {
                    const inflatedString = data.toString('utf-8');
                    if (inflatedString.length > 0) {
                        const json = parse(inflatedString);
                        done(null, json);
                        return;
                    }
                    done(null, false);
                    return;
                } else {
                    done(null, false);
                    return;
                }
            });
        } catch (error) {
            err.statusCode = 400;
            done(err, undefined);
            return;
        }
    } else {
        try {
            const json = parse(body);
            done(null, json);
        } catch (err) {
            err.statusCode = 400;
            done(err, undefined);
        }
    }
});

app.addContentTypeParser('*', (req, payload, done) => {
    const chunks = [];
    payload.on('data', chunk => {
        chunks.push(chunk);
    });
    payload.on('end', () => {
        done(null, Buffer.concat(chunks));
    });
});

/**
* Register Handler
*/

app.server.on("upgrade", function (request, socket, head) {
    logger.logInfo("upgrade");
});

app.server.on("error", function (error) {
    logger.logError(error);
});

app.server.on("listening", function (){
    logger.logConsole(``);
    logger.logConsole(``);
    logger.logConsole(`     █▀▄▀█    ▄▄▄▄▀   ▄▀  ██   `);
    logger.logConsole(`     █ █ █ ▀▀▀ █    ▄▀    █ █  `);
    logger.logConsole(`     █ ▄ █     █    █ ▀▄  █▄▄█ `);
    logger.logConsole(`     █   █    █     █   █ █  █ `);
    logger.logConsole(`        █    ▀       ███     █ `);
    logger.logConsole(`       ▀                    █  `);
    logger.logConsole(`                           ▀`);
    logger.logConsole(`     Make Tarkov Great Again`);
    logger.logConsole(``);
});

app.register(require('./plugins/register.js'));

app.listen({ port: database.core.serverConfig.port, host: database.core.serverConfig.ip });

