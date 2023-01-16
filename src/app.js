import express, {json} from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"
import joi from "joi"
import dayjs from "dayjs"

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

app.get("/participants", (req, res) => {

    db.collection("participants").find().toArray().then(
        datas => {
            return res.send(datas) 
    }).catch((err) => {
        res.status(500).send(`:( Error: ${err}`)
    })
})

app.get("/messages", async (req, res) => {
    const { user } = req.headers
    let limit = 100
    let lastMessages = []

    try{
        const listMessages = await db.collection("messages").find().toArray()
        const messages = listMessages.filter((message) => {
            if(message.type === 'message' || message.type === 'status'){
                return true
            }

            if(message.type === 'private_message' && message.from === user || message.to === user){
                return true
            }

            return false
        })

        if(req.query.limit){
            limit = parseInt(req.query.limit)

            if(limit < 1 || isNaN(limit)){
                return res.status(422).send("Invalid limit")
            }

            lastMessages = messages.reverse().slice(0, limit).reverse()
            return res.send(lastMessages)
        }

        res.send(messages)

        } catch (err) {
        res.sendStatus(500)
    }
})

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

        const newUserMessage = {
            from: user.name,
            to: "Todos",
            text: "entra na sala...",
            type: "status",
            time: dayjs(newUser.lastStatus).format("HH:mm:ss")
        }

        await db.collection("participants").insertOne(newUser)
        await db.collection("messages").insertOne(newUserMessage)
        res.sendStatus(201)
    }catch (err){
        res.sendStatus(500)
    }
})

app.post("/messages", async (req, res) => {
    const { to, type, text } = req.body
    const { user } = req.headers

    try{
        const existUser = await db.collection("participants").findOne({ name: user })
        if(!existUser) {
           return res.status(422).send("ocorreu um erro")
        }

        const newMessage = {
            from: existUser.name,
            to,
            text,
            type,
            time: dayjs(Date.now()).format("HH:mm:ss")
        }

        const messageSchema = joi.object({
            from: joi.string().required(),
            to: joi.string().required(),
            text: joi.string().required(),
            type: joi.string().valid("message", "private_message").required(),
            time: joi.string().required()
        })

        const validation = messageSchema.validate(newMessage, {abortEarly: false})
        if(validation.error) {
            const err = validation.error.details.map( item => item.message)
            return res.status(422).send(err)
        }

        await db.collection("messages").insertOne(newMessage)
        res.sendStatus(201)
        console.log(newMessage)
    }catch(err) {
        res.sendStatus(500)
    }
})

const PORT = 5000
app.listen(PORT, () => {
    console.log("Welcome to Bate Papo Uol API")
})