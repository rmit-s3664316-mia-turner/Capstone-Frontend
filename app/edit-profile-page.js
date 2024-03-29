﻿const app = require("tns-core-modules/application");
var application = require("application");
var http = require("http");
var bghttp = require("nativescript-background-http");
var session = bghttp.session("file-upload");
var observable = require("data/observable");
var frameModule = require("ui/frame");
var viewModel = new observable.Observable();
const appSettings = require("application-settings");
var dialogs = require("tns-core-modules/ui/dialogs");
var imagepicker = require("nativescript-imagepicker");
const DatePicker = require("tns-core-modules/ui/date-picker").DatePicker;
const dropdown = require("nativescript-drop-down");
var Toast = require("nativescript-toast");
const BatsmanTypes = require("../app/helpers/type-list").BatsmanTypes;
const BowlerTypes = require("../app/helpers/type-list").BowlerTypes;
const HTTPRequestWrapper = require("../app/http/http-request");

// consts
const batsmanTypeItems = BatsmanTypes.makeDropdownList();
const bowlerTypeItems = BowlerTypes.makeDropdownList();

// profile
var userId;
var isSelf;

// title
var pageTitle;

// user args
var imgSrc;
var imgSrcOriginal;
var name;
var email;
var phone;

// player info args
var isPlayer;
var batsmanTypeIndex;
var batsmanTypeList;
var bowlerTypeIndex;
var bowlerTypeList;
var birthDate;
var maxDate;

// coach info args
var isCoach;
var yearsExperience;

// loading
var isLoading;
var isUploading;

const modalCalendarModule = "modal-date";

/**
 * Sets up page. Gets data to display to the page.
 * @param {any} args
 */
function navigatingTo(args) {
    page = args.object;

    isSelf = true;  // for now we can only edit outselves.
    var sendToken = appSettings.getString(global.tokenAccess);

    // set main stuff
    pageTitle = "Edit Profile";
    viewModel.set("profileTitle", pageTitle);
    viewModel.set("batsmanTypeItems", batsmanTypeItems);
    viewModel.set("bowlerTypeItems", bowlerTypeItems);
    page.bindingContext = viewModel;

    // load
    isLoading = true;
    viewModel.set("isLoading", isLoading);

    // reset
    _resetPage();

    // we can only edit ourself. So we don't add other features in.
    if (isSelf) {
        var request = new HTTPRequestWrapper(
            global.serverUrl + global.endpointUser + "me/",
            "GET",
            "application/json",
            sendToken
        );
        request.send(
            function (result) {
                var obj = JSON.stringify(result);
                obj = JSON.parse(obj);

                // user didn't get from database.
                if (!obj.content || !obj.content.id) {
                    console.error("Could not find myself.");
                    return;
                }

                // go through vars and add to profile page
                _makeProfilePage(obj.content, isSelf);

            },
            function (error) {
                isLoading = false;
                viewModel.set("isLoading", isLoading);
                dialogs.alert({
                    title: "Error getting profile data!",
                    message: error.message,
                    okButtonText: "Okay"
                }).then(
                    function () {
                        frameModule.topmost().goBack();
                    });
                return;
            }
        );
    }
    // we have somehow tried to view someone else's profile. That's not allowed.
    else {
        dialogs.alert({
            title: "Can't edit a different user",
            message: "You can only edit your own profile.",
            okButtonText: "Okay"
        }).then(
            function () {
                frameModule.topmost().goBack();
            });
    }

    // handle update to player status. Show / hide relevant fields.
    const playerSwitch = page.getViewById("player-switch");
    playerSwitch.on("checkedChange", (args) => {
        viewModel.set("isPlayer", args.object.checked);
        isPlayer = args.object.checked;
    });

    // handle update to coach status. Show / hide relevant fields.
    const coachSwitch = page.getViewById("coach-switch");
    coachSwitch.on("checkedChange", (args) => {
        viewModel.set("isCoach", args.object.checked);
        isCoach = args.object.checked;
    });

}
exports.navigatingTo = navigatingTo;

/**
 * Show menu.
 * @param {any} args
 */
function onDrawerButtonTap(args) {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
 }
exports.onDrawerButtonTap = onDrawerButtonTap;

/**
 * Puts all the user's data onto the page.
 * @param {any} user
 * @param {any} isSelf
 */
function _makeProfilePage(user, isSelf) {
    /*
    Reminders:
    name            : String
    email           : String
    phone           : String
    imgSrc          : String
    inClub          : boolean
    clubs           : NOT IMPLEMENTED
    isPlayer        : boolean
    batsmanType     : String
    bowlerType      : String
    birthDate       : String
    isCoach         : boolean
    yearsExperience : integer
    canEdit         : boolean
    */

    firstName = user.first_name
    lastName = user.last_name;
    imgSrc = user.profile_pic;
    imgSrcOriginal = imgSrc;
    isPlayer = user.is_player;
    if (isSelf) {
        email = user.email;
        if (isPlayer && user.player) {
            phone = user.player.phone_number;
        }
    }
    inClub = false; // TODO make club display work

    // set batsman dropdown
    batsmanTypeList = new dropdown.ValueList(batsmanTypeItems);
    viewModel.set("batsmanTypeList", batsmanTypeList);
    batsmanTypeIndex = 0;

    // set bowler dropdown
    bowlerTypeList = new dropdown.ValueList(bowlerTypeItems);
    viewModel.set("bowlerTypeList", bowlerTypeList);
    bowlerTypeIndex = 0;

    // set up player data
    if (isPlayer && user.player) {
        batsmanTypeIndex = user.player.batsman_type;
        bowlerTypeIndex = user.player.bowler_type;
        birthDate = new Date(user.player.birthdate);
    }
    maxDate = Date.now();

    // set up coach data
    isCoach = user.is_coach;
    if (isCoach && user.coach) {
        yearsExperience = user.coach.years_experience;
    }

    // set up birth date
    birthDate = birthDate.toISOString().split('T')[0];

    // show all
    viewModel.set("imgSrc", imgSrc);
    viewModel.set("firstName", firstName);
    viewModel.set("lastName", lastName);
    viewModel.set("email", email);
    viewModel.set("phone", phone);
    viewModel.set("isPlayer", isPlayer);
    viewModel.set("batsmanTypeIndex", batsmanTypeIndex);
    viewModel.set("bowlerTypeIndex", bowlerTypeIndex);
    viewModel.set("birthDate", birthDate);
    viewModel.set("maxDate", maxDate);
    viewModel.set("isCoach", isCoach);
    viewModel.set("yearsExperience", yearsExperience);

    // done. Stop loading
    isLoading = false;
    viewModel.set("isLoading", isLoading);

}

/**
 * Goes back.
 * @param {any} args
 */
function cancel(args) {
    page.frame.goBack();
}
exports.cancel = cancel;

/**
 * Upload changes to database
 * @param {any} args
 */
function save(args) {
    // user args
    var saveImgSrc = viewModel.get("imgSrc");
    var saveFirstName = viewModel.get("firstName");
    var saveLastName = viewModel.get("lastName");
    var saveEmail = viewModel.get("email");
    var savePhone = viewModel.get("phone");

    // password
    var oldPassword = viewModel.get("oldPassword");
    var newPassword = viewModel.get("newPassword");
    var confirmPassword = viewModel.get("confirmPassword");

    // block for uploading
    isUploading = true;
    viewModel.set("isUploading", isUploading);

    // player info args
    let dropdownBatsman = page.getViewById("batsmanType");
    var saveBatsmanType = dropdownBatsman.selectedIndex;
    let dropdownBowler = page.getViewById("bowlerType");
    var saveBowlerType = dropdownBowler.selectedIndex;
    let saveBirthDate = viewModel.get("birthDate");

    // coach info args
    var saveYearsExperience = viewModel.get("yearsExperience");

    // add all valid fields to this object
    var allFields = [];
    // use this to keep track of things that are not valid. Should display these
    // in an error message to the user.
    var validationString = "";

    // reminders:
    // FIELD: { name: "name", value: clubName }
    // FILE: { name: "logo", filename: file, mimeType: "image/*" }

    // check if birth date is valid
    var today = new Date();
    var offset = today.getTimezoneOffset(); 
    today = new Date(today.getTime() - (offset * 60 * 1000));

    // phone validation is not working properly at the moment, regex check needs to match the backend
    // var regex = new RegExp("^(?:\\+?(61))? ?(?:\\((?=.*\\)))?(0?[2-57-8])\\)? ?(\\d\\d(?:[- ](?=\\d{3})|(?!\\d\\d[- ]?\\d[- ]))\\d\\d[- ]?\\d[- ]?\\d{3})$");
    // if (!savePhone.match(regex)){
    //     console.log("didn't match" + savePhone);
    //     validationString = validationString + "Valid Australian Phone Number \n";
    // }

    // add names
    if (!saveFirstName) {
        validationString = validationString + "First Name \n";
    }
    if (!saveLastName) {
        validationString = validationString + "Last Name \n";
    }

    // check if birth date is set. This generally should be set, but if it
    // isn't then we need to tell the user.
    if (isPlayer && !saveBirthDate) {
        if (saveBirthDate > today){
            validationString = validationString + "Valid Birthdate \n";
        }   
    }

    // handle validation checks. Return if invalid. Validation string is what
    // we use to check.
    if (validationString != "") {
        dialogs.alert({
            title: "Profile Update Error - Invalid Details",
            message: "The following fields are required to update profile: \n" + validationString,
            okButtonText: "Okay"
        });
        isUploading = false;
        viewModel.set("isUploading", isUploading);
        return;
    }

    // check names and add
    if (saveFirstName != firstName) {
        allFields.push({ name: "first_name", value: saveFirstName });
    }
    if (saveLastName != lastName) {
        allFields.push({ name: "last_name", value: saveLastName });
    }

    // check imgSrc and add
    if (saveImgSrc != imgSrcOriginal) {
        allFields.push({ name: "profile_pic", filename: saveImgSrc, mimeType: "image/*" });
    }

    // http request only accepts strings
    var stringBatsman = String(saveBatsmanType);
    var stringBowler = String(saveBowlerType);
    var stringBirthdate = saveBirthDate;
    allFields.push({ name: "is_player", value: isPlayer.toString() });
    if (isPlayer) {
        if (savePhone != phone) {
            allFields.push({ name: "player.phone_number", value: savePhone });
        }
        if (saveBatsmanType != batsmanTypeIndex) {
            allFields.push({ name: "player.batsman_type", value: stringBatsman });
        }
        if (saveBowlerType != bowlerTypeIndex) {
            allFields.push({ name: "player.bowler_type", value: stringBowler });
        }
        if (saveBirthDate) {
            allFields.push({ name: "player.birthdate", value: stringBirthdate });
        }
    }

    // do all coach fields
    allFields.push({ name: "is_coach", value: isCoach.toString() });
    if (isCoach) {
        if (saveYearsExperience != yearsExperience) {
            allFields.push({ name: "coach.years_experience", value: saveYearsExperience });
        }
    }

    // do upload
    let sendToken = appSettings.getString(global.tokenAccess);
    var request = {
        url: global.serverUrl + global.endpointUser + "me/",
        method: "PATCH",
        headers: {
            "Content-Type": "multipart/form-data", "Authorization": "Bearer " + sendToken
        },
        description: "Updating"
    };

    var task = session.multipartUpload(allFields, request);
    // task.on("progress", progressHandler);
    task.on("error", errorHandler);
    // task.on("responded", respondedHandler);
    task.on("complete", completeHandler);
    
}
exports.save = save;

/**
 * Opens a modal dialog for changing the birth date.
 * @param {any} args
 */
function showBirthDate(args){
    const button = args.object;
    const fullscreen = false;

    // determine date params
    const context = {};

    if (birthDate){
        context.birthDate = viewModel.get("birthDate");
    }

    var callback = function (vals) {
        console.log(vals);
        if (!vals) {
            // do nothing
            return;
        }
        var date = vals.date;
        viewModel.set("birthDate", date);
    }
    button.showModal(modalCalendarModule, context, callback, fullscreen);
}
exports.showBirthDate = showBirthDate;

/**
 * Allows user to select a new image for their profile picture.
 */
function changeImage() {
    var context = imagepicker.create({ mode: "single" });
    context
        .authorize()
        .then(() => {
            return context.present();
        })
        .then(function (selection) {
            if (selection.length > 0) {
                imgSrc = selection[0].android.toString();
                viewModel.set("imgSrc", imgSrc);
            } else {
                console.log("No image could be found.");
            }
        })
        .catch(function (e) {
            console.error(e);
            dialogs.alert({
                title: "Error getting images",
                message: e,
                okButtonText: "Okay"
            }).then(function () { });
        });
}
exports.changeImage = changeImage;

/**
 * Handles the password change.
 * Note: not implemented.
 * @param {any} args
 */
function passwordChange(args) {
    //Password change to be implemented
    if (oldPassword || newPassword || confirmPassword) {
        let completed = 0;
        completed += oldPassword ? 1 : 0;
        completed += newPassword ? 1 : 0;
        completed += confirmPassword ? 1 : 0;
        if (completed < 3 || newPassword != confirmPassword) {
            dialogs.alert({
                title: "Bad password!",
                message: "Password fields must either be filled out properly or left blank.",
                okButtonText: "Okay"
            }).then(function () { });
            return;
        }
        // TODO check old password before sending. Not sure how.
    }
}
exports.passwordChange = passwordChange;

/**
 * Does something when progress is updated.
 * Note: Not implemented.
 * @param {any} e event arguments:
 *        task: Task
 *        currentBytes: number
 *        totalBytes: number
 */

function progressHandler(e) {
    console.log("uploaded " + e.currentBytes + " / " + e.totalBytes);
}


/**
 * Handles an error message.
 * @param {any} e  event arguments:
 *        task: Task
 *        responseCode: number
 *        error: java.lang.Exception (Android) / NSError (iOS)
 *        response: net.gotev.uploadservice.ServerResponse (Android) / NSHTTPURLResponse (iOS)
 */
function errorHandler(e) {
    isUploading = false;
    viewModel.set("isUploading", isUploading);
    console.error("received " + e.responseCode + " code.");
    dialogs.alert({
        title: "Error uploading profile data.",
        message: "Error code: " + e.responseCode,
        okButtonText: "Okay"
    }).then(function () { });
    var serverResponse = e.response;
}

/**
 * Check if a response is received. NOT IMPLEMENTED.
 * @param {any} e event arguments:
 *        task: Task
 *        responseCode: number
 *        data: string
 */
function respondedHandler(e) {
    console.log("responded received " + e.responseCode + " code. Server sent: " + e.data);
}


/**
 * Does something with the upload is completed.
 * @param {any} e event arguments:
 *        task: Task
 *        responseCode: number
 *        response: net.gotev.uploadservice.ServerResponse (Android) / NSHTTPURLResponse (iOS)
 */
function completeHandler(e) {
    var toast = Toast.makeText("Profile Saved");
    toast.show();
    isUploading = false;
    viewModel.set("isUploading", isUploading);
    page.frame.goBack();
}

/**
 * Does something when the upload is cancelled.
 * @param {any} e event arguments:
 *        task: Task
 */
function cancelledHandler(e) {
    console.log("upload cancelled");
}

/**
 * Block back functionality while uploading.
 * @param {any} args
 */
function backEvent(args) {
    if (isUploading) {
        args.cancel = true;
    }
}
exports.backEvent = backEvent;

/**
 * Sets all values to default. Waits for response from server.
 */
function _resetPage() {

    // set all vars
    imgSrc = null;
    firstName = null;
    lastName = null;
    email = null;
    phone = null;
    isPlayer = false;
    batsmanTypeIndex = 0;
    bowlerTypeIndex = 0;
    birthDate = Date.now();
    maxDate = Date.now();
    isCoach = false;
    yearsExperience = 0;

    // set all
    viewModel.set("imgSrc", imgSrc);
    viewModel.set("firstName", firstName);
    viewModel.set("lastName", lastName);
    viewModel.set("email", email);
    viewModel.set("phone", phone);
    viewModel.set("isPlayer", isPlayer);
    viewModel.set("batsmanTypeIndex", batsmanTypeIndex);
    viewModel.set("bowlerTypeIndex", bowlerTypeIndex);
    viewModel.set("isCoach", isCoach);
    viewModel.set("yearsExperience", yearsExperience);

}