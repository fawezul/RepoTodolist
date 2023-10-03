import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import lodash from "lodash";
import ejs from "ejs";

const _ = lodash();

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express()

app.set("view engine", ejs); //view engine is responsible for html templates, tells it to use ejs template engine in web app.
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true})); //req.body

//connect db(make new db) - create schema - model - create data with model - insert data into db
//read from db - render the data/task

//Database connection
mongoose.set('strictQuery', false); //gets rid of warnings in the console

const connectDB = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  };

//Creating item and list schema
const itemSchema = ({
    name: {
        type: String
    }
});
const itemModel = mongoose.model ("Item", itemSchema);

//=======================================================================================
const listSchema =({
    name: String,
    item: [itemSchema]
})

const listModel = mongoose.model("list", listSchema)

//RENDER ITEMS
app.get("/", (req,res) =>{
    const today = "Today";

   itemModel.find({}) //find every collection with itemModel
   .then( (item) =>{ //gets the items as a whole
       res.render("index.ejs", { data: item, title:today})
   })
   .catch((err)=>{console.log(err)})

});


//SUBMIT ITEMS
app.post("/submit", (req,res)=>{
    const customName = req.body.title
    const taskData= req.body.taskData; //ning

    const taskIntoItem = new itemModel(
        {name: taskData});

    if (customName==="Today"){
        taskIntoItem.save(); //saves into db
   res.redirect("/");}

   if (customName!== "Today") {
    listModel.findOne({name:customName}) //home
    .then( (collections)=>{  //{}

        if (!collections){
            //make new personal List
        const list = new listModel({
        name: customName,
        item: taskIntoItem
    });
    list.save();
    res.redirect("/" + customName);
} 
      else{
            collections["item"].push(taskIntoItem)
            collections.save();
            res.redirect("/" + customName);
        }
    })
    .catch((err)=>{console.log(err)})
   }
});

//DELETE
app.post("/delete", (req,res)=>{
   
    const checkBoxID =req.body.check;  //id of item checked
    const title = req.body.title;
  
    if (title==="Today"){
        itemModel.deleteOne({_id:checkBoxID})
        .then().catch((err)=>{console.log(err)})
        res.redirect("/");
    }
    else{
        listModel.findOneAndUpdate({name:title}, {$pull: {item: {_id: checkBoxID}}})
        .then( ()=>{
        })
        .catch((err)=>{
            console.log(err)
        })
        res.redirect("/" + title)
        
    }
});


//connect db 1st then start app
connectDB().then(() =>{
    app.listen(PORT, ()=>{
        console.log(`Listening on port ${PORT}`)
    } )
});
