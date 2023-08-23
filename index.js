import express from "express";
import { promises } from "dns";
import { Socket } from "net";
import net from "net";
import tls from "tls";

const app = express();
const port = 4000;

// Sample data for demonstration
const items = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  { id: 3, name: 'Item 3' }
];

function checkEmail(email) {
  return new Promise(async (resolve) => {
    const mxhosts = await promises.resolveMx(email.split("@")[1]);
    console.log(mxhosts);
    if (mxhosts.length === 0) {
      resolve("invalid");
    } else {
      let valid = "invalid";
      const mainHostSet = new Set();
      const finalHostArray = [];

      mxhosts.forEach((mxhost) => {
        const hostParts = mxhost.exchange.split(".");
        const bottomHostName = `${hostParts[hostParts.length - 2]}.${
          hostParts[hostParts.length - 1]
        }`;

        if (!mainHostSet.has(bottomHostName)) {
          mainHostSet.add(bottomHostName);
          finalHostArray.push(mxhost.exchange);
        }
      });

      for (const host of finalHostArray) {
        const socket = new Socket();

        socket.connect(25, host, async () => {
          const startSock = new Date().getTime();
          socket.setTimeout(10000);

          socket.on("data", (data) => {
            console.log(data, "data");
            const endSock = new Date().getTime();
            const diffSock = (endSock - startSock) / 1000;

            if (diffSock >= 10) {
              valid = "Accept All";
              socket.end();
              resolve(valid);
            }

            if (
              data.toString().startsWith("220") ||
              data.toString().startsWith("554")
            ) {
              // socket.write(`HELO ${email.split('@')[1]} \r\n`);
              socket.write(`HELO \r\n`);
              // socket.write(`HELO \r\n`);
              socket.once("data", (data1) => {
                console.log(data1.toString(), "data1");
                if (
                  data1.toString().startsWith("220") ||
                  data1.toString().startsWith("250")
                ) {
                  socket.write(`mail from : <rishikeshkeshari47@outlook.com> \r\n`);
                  console.log(socket);
                  socket.once("data", (data2) => {
                    console.log(data2.toString(), "data2");
                    socket.write(`rcpt to: <${email}> \r\n`);
                    socket.once("data", (data3) => {
                      console.log("in data 3");
                      console.log(data3.toString(), "data3");
                      if (!data3.toString().includes("550")) {
                        if (data3.toString().includes("2.1.5")) {
                          valid = "valid";
                        } else {
                          valid = "Accept All";
                        }
                      }

                      socket.end();
                      resolve(valid);
                    });
                  });
                }
              });
            }
          });
        });

        socket.on("error", () => {
          socket.destroy();
        });

        socket.on("timeout", () => {
          socket.destroy();
        });
      }
    }
  });
}

// Example usage:
const email = "rishikeshkeshari47@outlook.com";


// Define a route to handle GET requests
app.get('/items', (req, res) => {
    checkEmail(email).then((result) => {
        console.log(`Email validity: ${result}`);
        res.json(result);
      });
  
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
