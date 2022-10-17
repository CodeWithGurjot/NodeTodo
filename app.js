const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const _ = require('lodash');

dotenv.config();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

mongoose.connect(process.env.MONGO_URI);

const itemsSchema = {
  name: String,
};

const Item = mongoose.model('item', itemsSchema);

const item1 = new Item({
  name: 'Welcome to your ToDo list!',
});

const item2 = new Item({
  name: 'Hit the + button to add a new item.',
});

const item3 = new Item({
  name: '<-- Hit this to delete an item.',
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model('List', listSchema);

app.get('/', function (req, res) {
  Item.find({}, (err, listItems) => {
    if (listItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log('New items inserted');
        }
      });
      res.redirect('/');
    } else {
      res.render('list', { listTitle: 'Today', newItems: listItems });
    }
  });
});

app.post('/', function (req, res) {
  const newItem = req.body.item;
  const listName = req.body.button;
  const item4 = new Item({
    name: newItem,
  });

  if (listName === 'Today') {
    item4.save();
    res.redirect('/');
  } else {
    List.findOne({ name: listName }, function (err, results) {
      results.items.push(item4);
      results.save();
      res.redirect('/' + listName);
    });
  }
});

app.post('/delete', function (req, res) {
  const checkedId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedId, (err) => {
      if (!err) {
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedId } } },
      function (err, results) {
        if (!err) {
          res.redirect('/' + listName);
        }
      },
    );
  }
});

app.get('/:anyList', function (req, res) {
  const anyList = _.capitalize(req.params.anyList);

  List.findOne({ name: anyList }, (err, results) => {
    if (!results) {
      const list = new List({
        name: anyList,
        items: defaultItems,
      });
      list.save();
      res.redirect('/' + anyList);
    } else {
      res.render('list', { listTitle: results.name, newItems: results.items });
    }
  });
});

let port = process.env.PORT;
if (port == null || port == '') {
  port = 5000;
}

app.listen(port, function () {
  console.log(`Server is started successfully on ${port}`);
});
