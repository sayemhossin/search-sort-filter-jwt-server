const express = require('express');
const app = express()
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config()
const port = process.env.port || 5000;



app.use(cors({
 origin:[
  'http://localhost:5173',
  'https://dimple-firebase-fdfc6.web.app',
  'https://dimple-firebase-fdfc6.firebaseapp.com'
 ],
  credentials:true
}))
app.use(express.json())
app.use(cookieParser())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ha1geqx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken = async(req,res,next)=>{
  const token = req?.cookies?.token
  if(!token){
    return res.status(401).send({message:'Unauthorized User'})
  }
  jwt.verify(token,process.env.JWT_TOKEN,(err,decode)=>{
    if(err){
      return res.status(401).send({message:'Unauthorized User'})
    }
    req.user=decode
    next()
  })
}



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const allCardCollection = client.db('practiceDB').collection('allcard')



    app.post('/alldata', async (req, res) => {
        const users = req.body
        const result = await allCardCollection.insertOne(users)
        res.send(result)
    })

    app.get('/alldata', async (req, res) => {
        const cursor = allCardCollection.find()
        const result = await cursor.toArray()
        res.send(result)


    })
    app.get('/alldata/:id', async (req, res) => {
        const id = req.params.id
        const query = { _id: new ObjectId(id) }
        const result = await allCardCollection.findOne(query)
        res.send(result)
    })

app.get('/mydata',verifyToken, async(req,res)=>{
  if(req.query.email !== req.user.email){
    return res.status(403).send({message:'Forbidden User'})

  }
    let query = {}
    if(req.query?.email){
        query = {email: req.query.email}
    }
    const result = await allCardCollection.find(query).toArray()
    res.send(result)
})

//  JWT part

app.post('/jwt', async(req,res)=>{
  const user = req.body
  const token = jwt.sign(user,process.env.JWT_TOKEN,{expiresIn:'7d'})
  res
  .cookie('token',token,{
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  })
  .send({success:true})
})

app.get('/logout', (req,res)=>{
  res
  .clearCookie('token',{
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge:0
  })
  .send({success:true})
})



// pagination
app.get('/alldatacount', async (req, res) => {
  const filter = req.query.filter
  const search = req.query.search
  let query = {
    name: {$regex:search, $options:'i'}
  }
  
  // if(filter) query = {name:filter}
  if(filter) query.name=filter

  const count = await allCardCollection.countDocuments(query)
 
  res.send({count})

  
})


app.get('/dataall', async (req, res) => {
const size = parseInt(req.query.size)
const page = parseInt(req.query.page) -1
const filter = req.query.filter
const sort = req.query.sort
const search = req.query.search
console.log(size,page);

let query = {
  name: {$regex:search, $options:'i'}
}
// if(filter) query = {name:filter} eita filter er jonne sudhu
if(filter) query.name=filter

let options = {}
if(sort) options={sort:{price: sort === 'asc' ? 1: -1}}


  const cursor = allCardCollection.find(query,options).skip(page*size).limit(size)
  const result = await cursor.toArray()
  res.send(result)


})






    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Practice server is running')
})


app.listen(port, () => {
    console.log(`practice server is running on port: ${port}`)
})