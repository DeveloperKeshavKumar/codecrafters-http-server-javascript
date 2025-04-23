const net = require("net");
const fs = require("fs");
const path = require("path");

console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
    socket.on("data", (data) => {
        const rawRequest = data.toString();
        const [headerPart, body] = rawRequest.split('\r\n\r\n');

        const requestLines = headerPart.split('\r\n');
        // console.log(requestLines);
        const requestLine = requestLines[0];
        const [method, urlPath, httpVersion] = requestLine.split(' ');

        const headerLines = requestLines.slice(1).filter(line => line.length > 0);

        const headers = {};
        for (const line of headerLines) {
            const [key, value] = line.split(': ');
            headers[key] = value;
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
                        socket.end();
                        return;
                    }

                    socket.write(
                        `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${fileData.length}\r\n\r\n`
                    );
                    socket.write(fileData);
                    socket.end();
                });
            } else if (method === 'POST') {
                const requestedFile = urlPath.slice(7);
                const filePath = path.join(baseDir, requestedFile);

                if (!fs.existsSync(baseDir)) {
                    fs.mkdirSync(baseDir, { recursive: true });
                }

                fs.writeFile(filePath, body, (err) => {
                    if (err) {
                        console.error("File write error:", err);
                        socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
                    } else {
                        socket.write('HTTP/1.1 201 Created\r\n\r\n');
                    }
                    socket.end();
                });
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
            socket.end();
            return;
        }

        else if (urlPath.startsWith('/echo/')) {
            const message = urlPath.slice(6);

            if (headers['Accept-Encoding']) {
                if (headers['Accept-Encoding'].includes('gzip')) {
                    socket.write(
                        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Encoding: gzip\r\n\r\n`
                    );
                }
                else {
                    socket.write(
                        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n`
                    );
                }
            } else {
                socket.write(
                    `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${message.length}\r\n\r\n${message}`
                );    
            }
            socket.end();
            return;
        }

        else if (urlPath === '/') {
            socket.write('HTTP/1.1 200 OK\r\n\r\n');
            socket.end();
            return;
        }

        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.end();
    });

    socket.on("close", () => {
        socket.end();
    });
});

server.listen(4221, "localhost");