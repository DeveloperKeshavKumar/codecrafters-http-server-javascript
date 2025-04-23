const net = require("net");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const server = net.createServer((socket) => {
    let buffer = '';

    socket.on("data", (chunk) => {
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

            if (headers['Connection'] && headers['Connection'].toLowerCase() === 'close') {
                socket.end();
            }

            if (urlPath.startsWith('/files/')) {
                const directoryIndex = process.argv.indexOf('--directory');
                const baseDir = directoryIndex !== -1 ? process.argv[directoryIndex + 1] : path.join(__dirname, 'tmp');
                if (method === 'GET') {
                    const requestedFile = urlPath.slice(7);
                    const filePath = path.join(baseDir, requestedFile);

                    fs.readFile(filePath, (err, fileData) => {
                        if (err) {
                            socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
                            return;
                        }

                        socket.write(
                            `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${fileData.length}\r\n\r\n`
                        );
                        socket.write(fileData);
                    });
                } else if (method === 'POST') {
                    const requestedFile = urlPath.slice(7);
                    const filePath = path.join(baseDir, requestedFile);

                    if (!fs.existsSync(baseDir)) {
                        fs.mkdirSync(baseDir, { recursive: true });
                    }

                    const contentLength = parseInt(headers['Content-Length'] || '0', 10);
                    requestBody = body || '';

                    const onData = (chunk) => {
                        requestBody += chunk.toString();
                        if (requestBody.length >= contentLength) {
                            socket.removeListener('data', onData);
                            fs.writeFile(filePath, requestBody, (err) => {
                                if (err) {
                                    console.error("File write error:", err);
                                    socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
                                } else {
                                    socket.write('HTTP/1.1 201 Created\r\n\r\n');
                                }
                            });
                        }
                    };

                    if (requestBody.length < contentLength) {
                        socket.on('data', onData);
                    } else {
                        fs.writeFile(filePath, requestBody, (err) => {
                            if (err) {
                                console.error("File write error:", err);
                                socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
                            } else {
                                socket.write('HTTP/1.1 201 Created\r\n\r\n');
                            }
                        });
                    }
                }

                return;
            }

            else if (urlPath === '/user-agent') {
                const userAgent = headers['User-Agent'];
                if (userAgent !== undefined) {
                    socket.write(
                        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`
                    );
                } else {
                    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
                }
                return;
            }

            else if (urlPath.startsWith('/echo/')) {
                const message = urlPath.slice(6);

                if (headers['Accept-Encoding']) {
                    if (headers['Accept-Encoding'].includes('gzip')) {
                        const compressed = zlib.gzipSync(message);
                        socket.write(
                            `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Encoding: gzip\r\nContent-Length: ${compressed.length}\r\n\r\n`
                        );
                        socket.write(compressed);
                    } else {
                        socket.write(
                            `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n`
                        );
                    }
                } else {
                    socket.write(
                        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${message.length}\r\n\r\n${message}`
                    );
                }
                return;
            }

            else if (urlPath === '/') {
                socket.write('HTTP/1.1 200 OK\r\n\r\n');
                return;
            }

            else {
                socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
            }

            if (!headers['Connection'] || headers['Connection'].toLowerCase() !== 'close') {
                socket.write('HTTP/1.1 200 OK\r\nConnection: keep-alive\r\n\r\n');
            }
        }
    });

    socket.on("close", () => {
        socket.end();
    });
});

server.listen(4221, "localhost");