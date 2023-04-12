const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");

const app = express();
const _ = require('lodash');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
mongoose.connect(process.env.WEBBLOGDB);

const itemsSchema = new mongoose.Schema({
  name: String
})

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Learn a lesson"
})
const item2 = new Item({
  name: "Optimize our code"
})
const item3 = new Item({
  name: "Check everythings are going well!"
})
const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model("List",listSchema)

app.get("/", function (req, res) {

  Item.find({}, function (err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (error) {
        if (err) {
          console.log(error);
        } else {
          console.log(defaultItems);
          console.log("Insert successfully");
        }
      })
      res.redirect("/");
    }else{
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
    

  })
});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name : itemName
  })
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name : listName},function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+ listName);
    }) 
  }
});

app.post("/delete" ,function (req,res) {
  const deleteItem = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(deleteItem, function (error) {
      if (error) {
        console.log(error);
      } else {
        console.log("Delete item id :" + deleteItem);
        res.redirect("/")
      }});
  } else {
     List.findOneAndUpdate(
      {name: listName},
      {$pull:{items:{ _id:deleteItem }}},
      function (err, foundList) {
        if(!err){
          console.log("Delete item id :" + deleteItem);
          res.redirect("/"+ listName);
        }
       
      })
  }
})

app.get("/:customListName",function (req,res) {
  let customListName = _.capitalize(req.params.customListName)  ;
  
  List.findOne({name: customListName}, function (err,foundList) {
    if (!err) {
      if(!foundList){
        console.log("Doesn't exist");
        const list = new List({
          name: customListName,
          items: defaultItems 
        })
        list.save();
        res.redirect("/"+ customListName);
      }
      else{
        console.log("Exists!");
        res.render("list", { listTitle: foundList.name , newListItems: foundList.items });
      }
    }
    
  })

});

app.get("/about", function (req, res) {
  res.render("about");
});

// app.listen(3000, function () {
//   console.log("Server started on port 3000");
// });
let port = process.env.PORT;
if (port == "null" || port =="" || port == "undefined") {
  port =3000;
}
app.listen(port, function () {
  console.log("Server running on port " + port);
})
