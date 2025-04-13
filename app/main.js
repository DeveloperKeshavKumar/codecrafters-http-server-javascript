const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        const request = data.toString();
        const headers = request.split('\r\n');
        let statusLine = headers[0].split(' ');
        let hostLine = headers[1];
        let requestHeaders = headers[2];
        let route = statusLine[1];

        // Respond With 200
        // socket.write('HTTP/1.1 200 OK\r\n\r\n');
        // socket.on("close", () => {
        //     socket.end();
        // });

        // Extract URL Path
        // if (headers[0] === 'GET / HTTP/1.1') {
        //     socket.write('HTTP/1.1 200 OK\r\n\r\n')
        // } else {
        //     socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
        // }

        // Respond With Body
        // if (route.startsWith('/echo/')) {
        //     route = route.slice(6);
        //     socket.write(`HTTP/1.1 200 OK\r\nContent-type: text/plain\r\nContent-length: ${route.length}\r\n\r\n${route}`);
        // } else if (route === '/') {
        //     socket.write('HTTP/1.1 200 OK\r\n\r\n');
        // }
        // else {
        //     socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        // }

        // Read Header
        const userAgent = requestHeaders.split(': ')[1];
        socket.write(`HTTP/1.1 200 OK\r\nContent-type: text/plain\r\nContent-length: ${userAgent.length}\r\n\r\n${userAgent}`)
    });

    socket.on("close", () => {
        socket.end();
    });
});

server.listen(4221, "localhost");
