const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        const request = data.toString();
        const headers = request.split('\r\n');
        const idx = headers[0].split(' ');
        const route = idx[1];
        
        socket.write(`HTTP/1.1 200 OK\r\nContent-type: text/plain\r\nContent-length: ${route.length -1}\r\n\r\n${route}`)

        // if (headers[0] === 'GET / HTTP/1.1') {
        //     socket.write('HTTP/1.1 200 OK\r\n\r\n')
        // } else {
        //     socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
        // }
    });

    socket.on("close", () => {
        socket.end();
    });
});

server.listen(4221, "localhost");
