-- config.lua

return {
    server = {
        host = "127.0.0.1",
        port = 8080,
    },
    logging = {
        level = "info",
        file  = "server.log",
    },
    features = {
        enable_metrics = true,
        experimental_api = false,
    }
}

