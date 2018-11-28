import app from './app';

const port = process.env.PORT || 3000;
app.listen(port, () => {
    `[*] Server started at ${port} port`;
});
