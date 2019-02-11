export function client(endpoint: string, fetch = window.fetch) {
    let handler = {
        get(api: any, method: string) {
            return async function handleRequest(params = {}) {
                try {
                    let resp = await fetch(endpoint + '/rpc/' + method, {
                        method: 'POST',
                        body: JSON.stringify(params),
                        headers: { 'Content-Type': 'application/json' }
                    })

                    let data = await resp.json()

                    if (!resp.ok) {
                        throw new Error("Server Error: " + data.msg)
                    }

                    return data
                } catch (err) {
                    // There is a network error
                    throw err
                }
            }
        }
    }

    return new Proxy({}, handler)
}

export function server(app: any) {
    let ctx = {}

    function handle(method: string, handler: any) {
        app.post('/rpc/' + method, async (req: any, res: any) => {
            try {
                let params = req.body
                let resp = await handler(params, ctx)

                return res.end(JSON.stringify(resp))
            } catch (err) {
                res.statusCode = 500
                return res.end(JSON.stringify({ msg: err.message }))
            }
        })

    }

    function handleNotFound() {
        app.post('/rpc/*', async (req: any, res: any) => {
            console.log(req)
            res.statusCode = 404
            return res.end(JSON.stringify({ msg: 'MethodNotFound' }))
        })
    }

    let proxyHandler = {
        get(target: any, methodName: string) {
            if (methodName in target) {
                return target[methodName]

            }

            return function (handler: any) {
                handle(methodName, handler)
            }
        }
    }


    return new Proxy({ handle, handleNotFound, ctx }, proxyHandler)
}