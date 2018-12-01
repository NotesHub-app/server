import app from './app';

// Вешаем службу express на внешний порт
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.info(`[*] Server started at ${port} port`);
});
