const assert = require("node:assert/strict");
const http = require("node:http");
const { after, before, test } = require("node:test");

process.env.API_TOKEN = "test-token";
const { app } = require("../src/server");

let server;
let port;

function request(path, method, token, body) {
    return new Promise((resolve, reject) => {
        const payload = body === undefined ? null : JSON.stringify(body);
        const req = http.request(
            {
                port,
                path,
                method,
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    ...(payload
                        ? {
                            "Content-Type": "application/json",
                            "Content-Length": Buffer.byteLength(payload)
                        }
                        : {})
                }
            },
            res => {
                res.resume();
                res.on("end", () => resolve(res.statusCode));
            }
        );

        req.on("error", reject);
        if (payload) req.write(payload);
        req.end();
    });
}

before(async () => {
    server = app.listen(0);
    await new Promise(resolve => server.once("listening", resolve));
    port = server.address().port;
});

after(async () => {
    await new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
    });
});

test("servindo a interface e o script do CRUD", async () => {
    assert.equal(await request("/", "GET"), 200);
    assert.equal(await request("/main.js", "GET"), 200);
});

test("protegendo rotas com token Bearer", async () => {
    assert.equal(await request("/api/tecnologias", "GET"), 401);
    assert.equal(await request("/api/tecnologias", "GET", "token-incorreto"), 401);
});

test("rejeitando dados obrigatórios ausentes ou base inválida", async () => {
    assert.equal(
        await request("/api/tecnologias", "POST", "test-token", {}),
        400
    );
    assert.equal(
        await request("/api/tecnologias", "POST", "test-token", {
            nome: "React",
            base: "Ruby",
            curvaAprendizado: "3 meses"
        }),
        400
    );
});
