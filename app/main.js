const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        const request = data.toString();
        const headers = request.split('\r\n');
        // console.log(headers);

        let statusLine = headers[0].split(' ');
        let route = statusLine[1];

        // Read Header
        if (route === '/user-agent') {
            const userAgentLine = headers.filter(x => x.startsWith("User-Agent:"));
            const userAgent = userAgentLine[0].split(": ")[1];
            if (userAgent !== undefined) {
                socket.write(`HTTP/1.1 200 OK\r\nContent-type: text/plain\r\nContent-length: ${userAgent.length}\r\n\r\n${userAgent}`)
            }
        }
        // Respond With Body
        else if (route.startsWith('/echo/')) {
            route = route.slice(6);
            socket.write(`HTTP/1.1 200 OK\r\nContent-type: text/plain\r\nContent-length: ${route.length}\r\n\r\n${route}`);
        }
        // Respond With 200
        else if (route === '/') {
            socket.write('HTTP/1.1 200 OK\r\n\r\n');
        }
        // Extract URL Path
        else {
            socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        }

        socket.end();
    });

    socket.on("close", () => {
        socket.end();
    });
});

server.listen(4221, "localhost");
