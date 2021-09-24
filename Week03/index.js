const express = require("express");
const app = express();
const { exec } = require("child_process");

const PORT = 3000;
app.use("/", (req, res) => {
    exec("open .", (err, out, stderr) => {
        if (err) {
            return res.status(400).send({ err });
        }
        return res.status(200).send({ message: "Success" });
    });

});

app.listen(PORT, () => {
    console.log(`Server started ${PORT}`);
});