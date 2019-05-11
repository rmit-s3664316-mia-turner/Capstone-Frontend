﻿var observable = require("data/observable");
var Sqlite = require("nativescript-sqlite");
var listViewModule = require("tns-core-modules/ui/list-view");
var Label = require("tns-core-modules/ui/label").Label;
var ObservableArray = require("data/observable-array").ObservableArray;
var viewModel = new observable.Observable();
var frameModule = require("ui/frame");
//const dialogs = require("tns-core-modules/ui/dialogs");

/**
 * Loads data when page is opened.
 * @param {any} args
 */
function onNavigatingTo(args) {
    page = args.object;
    const container = page.getViewById("container");
    const listView = new listViewModule.ListView();
    var lists = new ObservableArray([]);

    // get list of local shots and display.
    (new Sqlite("my.db")).then(db => {
        db.execSQL("CREATE TABLE IF NOT EXISTS test1 (id INTEGER PRIMARY KEY AUTOINCREMENT, path TEXT, name TEXT, shottype TEXT, ratingtype TEXT)").then(id => {
            console.log("table created");

            (new Sqlite("my.db")).then(db => {
                db.all("SELECT path,name, shottype, ratingtype, date FROM test1").then(rows => {
                    for (var row in rows) {
                        console.log("RESULT", rows[row]);
                        // var test = rows[row].toString();
                        // console.log(test);
                        lists.push({ path: rows[row][0], name: rows[row][1], shottype: rows[row][2], rating: rows[row][3], date: rows[row][4] });
                        console.log(rows[row][3]);
                    }
                    // console.log(rows);
                    // listView.items = rows;
                }, error => {
                    console.log("SELECT ERROR", error);
                });
            });

        }, error => {
            console.log("CREATE TABLE ERROR", error);
        });
    }, error => {
        console.log("OPEN DB ERROR", error);
    });

    listView.items = lists;

    // trigger for when shots are loaded from DB.
    listView.on(listViewModule.ListView.itemLoadingEvent, (args) => {
        if (!args.view) {
            // Create label if it is not already created.
            args.view = new Label();
            args.view.className = "list-group-item";
        }
        (args.view).text = "Player: " + listView.items.getItem(args.index).name + " Shot: " + listView.items.getItem(args.index).shottype + " Rating: " +
            listView.items.getItem(args.index).rating;
        (args.view).textWrap = true;

    });

    // trigger for when an item is tapped.
    listView.on(listViewModule.ListView.itemTapEvent, (args) => {
        const tappedItemIndex = args.index;
        const tappedItemView = args.view;
        var file = listView.items.getItem(args.index).path;
        var name = listView.items.getItem(args.index).name;
        var shottype = listView.items.getItem(args.index).shottype;
        var rating = listView.items.getItem(args.index).rating;
        var date = listView.items.getItem(args.index).date;
        var navigationOptions = {
            moduleName: 'view-shot-page',
            context: { path: file, name: name, shottype: shottype, rating: rating, date: date }
        }
        container.removeChild(listView);
        frameModule.topmost().navigate(navigationOptions);
    });

    container.addChild(listView);

}
exports.onNavigatingTo = onNavigatingTo;

/**
 * Opens Sidedrawer.
 * @param {any} args
 */
function onDrawerButtonTap(args) {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
}
exports.onDrawerButtonTap = onDrawerButtonTap;

/**
 * Navigates to a shot that was tapped.
 * @param {any} args
 */
function navigateToSingle(args) {
    const button = args.object;
    const page = button.page;
    // TODO pass data so that shot info can be loaded.
    page.frame.navigate("view-shot-page");
}
exports.navigateToSingle = navigateToSingle;