﻿const appSettings = require("application-settings");
var observable = require("data/observable").Observable;
var fileSystemModule = require("tns-core-modules/file-system");
var imagepicker = require("nativescript-imagepicker");
var app = require("tns-core-modules/application");
var http = require("http");
var bghttp = require("nativescript-background-http");
var session = bghttp.session("file-upload");

// Variables
var logo = null;
var sendToken;
var viewModel;
var clubName = "";
var clubPhone = "";
var adddressLine1 = "";
var addressLine2 = "";
var addressSuburb = "";
var addressPostcode = "";
var addressCountry = "";

/**
 * Handles initialisation of club creation.
 * @param {any} args
 */
function onNavigatingTo(args) {
    page = args.object;
    viewModel = new observable();
    page.bindingContext = viewModel;
    viewModel.set("phoneNumber", "");
    viewModel.set("clubName", "");
    viewModel.set("street_address_l1", "");
    viewModel.set("street_address_l2", "");
    viewModel.set("suburb", "");
    viewModel.set("postcode", "");
    viewModel.set("country", "");
    var token = appSettings.getString(global.tokenAccess);
    sendToken = token;
}
exports.onNavigatingTo = onNavigatingTo;

/**
 * Opens the Sidedrawer
 */
function onDrawerButtonTap(args) {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
}
exports.onDrawerButtonTap = onDrawerButtonTap;

/**
 * Picks an image. Sets it as the logo.
 */
function imagePicker() {
    var context = imagepicker.create({ mode: "single" });
    context
        .authorize()
        .then(function () {
            return context.present();
        })
        .then(function (selection) {
            selection.forEach(function (selected) {
                // process the selected image
                logo = selected.android.toString();
            });
            list.items = selection;
        }).catch(function (e) {
            // process error
        });
}
exports.imagePicker = imagePicker;

/**
 * Sends a requrest to the server to create the club.
 */
function clubRequest() {
    // TODO clientside validation!

    const documentsFolder = fileSystemModule.knownFolders.currentApp();
    const path = fileSystemModule.path.join(documentsFolder.path, "images/ball.jpg");
    var file;
    if (logo !== null) {
        file = logo;
    }
    else {
        file = path;
    }
    var url = global.serverUrl + global.endpointClub;

    // upload configuration

    clubName = viewModel.get("clubName");
    clubPhone = viewModel.get("phoneNumber");
    adddressLine1 = viewModel.get("street_address_l1");
    console.log("here" + adddressLine1);
    addressLine2 = viewModel.get("street_address_l2");
    addressSuburb = viewModel.get("suburb");
    addressPostcode = viewModel.get("postcode");
    addressCountry = viewModel.get("country");

    var request = {
        url: url,
        method: "POST",
        headers: {
            "Content-Type": "multipart/form-data", "Authorization": "Bearer " + sendToken
        },
        description: "Uploading "
    };

    var params = [
        { name: "name", value: clubName },
        { name: "phone_number", value: clubPhone },
        { name: "street_address_l1", value: adddressLine1 },
        { name: "street_address_l2", value: addressLine2 },
        { name: "suburb", value: addressSuburb },
        { name: "postcode", value: addressPostcode },
        { name: "country", value: addressCountry },
        { name: "logo", filename: file, mimeType: "image/*" }
    ];

    var task = session.multipartUpload(params, request);

    task.on("error", errorHandler);
    task.on("responded", respondedHandler);
    task.on("complete", completeHandler);

    /**
     * Gives the user a response when there is an error.
     * @param {any} e event arguments:
     *        task: Task
     *        responseCode: number
     *        error: java.lang.Exception (Android) / NSError (iOS)
     *        response: net.gotev.uploadservice.ServerResponse (Android) / NSHTTPURLResponse (iOS)
     */
    function errorHandler(e) {
        alert(e.responseCode + e.response.getBodyAsString())
        var serverResponse = e.response;
        console.error(e.error);
    }

    /**
     * Gives a response to the user when the request has been rececived.
     * @param {any} e event arguments:
     *        task: Task
     *        responseCode: number
     *        data: string
     */
    function respondedHandler(e) {
        alert("responded received " + e.responseCode + " code. Server sent: " + e.data);
    }

    /**
     * Alerts user when club is created.
     * @param {any} e event arguments:
     *        task: Task
     *        responseCode: number
     *        response: net.gotev.uploadservice.ServerResponse (Android) / NSHTTPURLResponse (iOS)
     */
    function completeHandler(e) {
        var serverResponse = e.response;
        alert("Club Created");
    }
}
exports.clubRequest = clubRequest;

/**
 * Validates on the clientside.
 */
function _validate() {
    // TODO
}