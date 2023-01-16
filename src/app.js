import express, {json} from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"
import joi from "joi"

dotenv.config()

const mongoClient = new MongoClient(process.env.DATABASE_URL)
let db

try {
    await mongoClient.connect()
    db = mongoClient.db()
} catch (error) {
    console.log(`:( Error: ${error}`)
}

const app = express()
app.use(cors())
app.use(json())

app.post("/participants", async (req, res) => {
    const user = req.body

    try{
        const userSchema = joi.object({
            name : joi.string().required()
        })

        const validation = userSchema.validate(user, {abortEarly: false});
        if(validation.error){
            const err = validation.error.details.map(item => item.message)
            return res.status(422).send(err)
        }

        const existUser = await db.collection("participants").findOne({name: user.name })
        if(existUser){
            return res.status(409).send("This user already exist")
        }

        const newUser = {
            name: user.name,
            lastStatus: Date.now()
        }

        await db.collection("participants").insertOne(newUser)
        res.sendStatus(201)
    }catch (err){
        res.sendStatus(500)
    }
})

app.get("/participants", (req, res) => {

    db.collection("participants").find().toArray().then(
        datas => {
            return res.send(datas) 
    }).catch((err) => {
        res.status(500).send(`:( Error: ${err}`)
    })
})

const PORT = 5000
app.listen(PORT, () => {
    console.log("Welcome to Bate Papo Uol API")
})