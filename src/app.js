import express, {json} from "express"
import cors from "cors"

const app = express()
app.use(cors())
app.use(json())

app.get("/", (req, res) => {
    res.send("Hello!")
})

const PORT = 5000
app.listen(PORT, () => {
    console.log("Welcome to Bate Papo Uol API")
})