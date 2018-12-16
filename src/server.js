import app from './app';
import ws from './ws';

// Вешаем службу express на внешний порт
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.info(`[*] Server started at ${port} port`);
});

ws.init(server);
