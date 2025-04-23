const net = require("net");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const server = net.createServer((socket) => {
    let buffer = '';
    let socketEnded = false;

    socket.on("data", (chunk) => {
        if (socketEnded) return;
        buffer += chunk.toString();

        while (true) {
            const headerEnd = buffer.indexOf('\r\n\r\n');
            if (headerEnd === -1) return;

            const headerPart = buffer.slice(0, headerEnd);
            const headers = {};
            const requestLines = headerPart.split('\r\n');
            const [method, urlPath, httpVersion] = requestLines[0].split(' ');

            requestLines.slice(1).forEach(line => {
                const [key, value] = line.split(': ');
                headers[key] = value;
            });

            const contentLength = parseInt(headers['Content-Length'] || '0', 10);
            const totalRequestLength = headerEnd + 4 + contentLength;

            if (buffer.length < totalRequestLength) return;
            const body = buffer.slice(headerEnd + 4, totalRequestLength);
            const remaining = buffer.slice(totalRequestLength);
            buffer = remaining;

            const closeConnection = headers['Connection'] && headers['Connection'].toLowerCase() === 'close';

            if (urlPath.startsWith('/files/')) {
                handleFilesRoute(socket, method, urlPath, headers, body, closeConnection);
            }
            else if (urlPath === '/user-agent') {
                handleUserAgentRoute(socket, headers, closeConnection);
            }
            else if (urlPath.startsWith('/echo/')) {
                handleEchoRoute(socket, urlPath, headers, closeConnection);
            }
            else if (urlPath === '/') {
                sendResponse(socket, 200, null, null, null, closeConnection);
            }
            else {
                sendResponse(socket, 404, null, null, null, closeConnection);
            }

            if (closeConnection) {
                socketEnded = true;
                return;
            }

            if (buffer.length === 0) break;
        }
    });

    socket.on("error", (err) => {
        console.error("Socket error:", err);
        if (!socketEnded) {
            socketEnded = true;
            socket.end();
        }
    });

    socket.on("close", () => {
        socketEnded = true;
    });

    function sendResponse(socket, statusCode, contentType, content, contentEncoding, closeConnection) {
        if (socketEnded) return;

        let statusText = '';
        switch (statusCode) {
            case 200: statusText = 'OK'; break;
            case 201: statusText = 'Created'; break;
            case 400: statusText = 'Bad Request'; break;
            case 404: statusText = 'Not Found'; break;
            case 500: statusText = 'Internal Server Error'; break;
            default: statusText = 'OK';
        }

        let headers = `HTTP/1.1 ${statusCode} ${statusText}\r\n`;

        if (contentType) {
            headers += `Content-Type: ${contentType}\r\n`;
        }

        if (contentEncoding) {
            headers += `Content-Encoding: ${contentEncoding}\r\n`;
        }

        if (content !== null) {
            const contentLength = Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content);
            headers += `Content-Length: ${contentLength}\r\n`;
        }

        if (closeConnection) {
            headers += 'Connection: close\r\n';
        }

        headers += '\r\n';

        if (content !== null) {
            socket.write(headers);
            socket.write(content);
        } else {
            socket.write(headers);
        }

        if (closeConnection) {
            socketEnded = true;
            socket.end();
        }
    }

    function handleFilesRoute(socket, method, urlPath, headers, body, closeConnection) {
        const directoryIndex = process.argv.indexOf('--directory');
        const baseDir = directoryIndex !== -1 ? process.argv[directoryIndex + 1] : path.join(__dirname, 'tmp');
        const requestedFile = urlPath.slice(7);
        const filePath = path.join(baseDir, requestedFile);

        if (method === 'GET') {
            fs.readFile(filePath, (err, fileData) => {
                if (err) {
                    sendResponse(socket, 404, null, null, null, closeConnection);
                    return;
                }
                sendResponse(socket, 200, 'application/octet-stream', fileData, null, closeConnection);
            });
        } else if (method === 'POST') {
            if (!fs.existsSync(baseDir)) {
                fs.mkdirSync(baseDir, { recursive: true });
            }

            fs.writeFile(filePath, body, (err) => {
                if (err) {
                    sendResponse(socket, 500, null, null, null, closeConnection);
                } else {
                    sendResponse(socket, 201, null, null, null, closeConnection);
                }
            });
        }
    }

    function handleUserAgentRoute(socket, headers, closeConnection) {
        const userAgent = headers['User-Agent'];
        if (userAgent !== undefined) {
            sendResponse(socket, 200, 'text/plain', userAgent, null, closeConnection);
        } else {
            sendResponse(socket, 400, null, null, null, closeConnection);
        }
    }

    function handleEchoRoute(socket, urlPath, headers, closeConnection) {
        const message = urlPath.slice(6);

        if (headers['Accept-Encoding'] && headers['Accept-Encoding'].includes('gzip')) {
            const compressed = zlib.gzipSync(message);
            sendResponse(socket, 200, 'text/plain', compressed, 'gzip', closeConnection);
        } else {
            sendResponse(socket, 200, 'text/plain', message, null, closeConnection);
        }
    }
});

server.listen(4221, "localhost");