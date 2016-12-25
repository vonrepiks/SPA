/**
 * Created by Hristo on 11.12.2016 г..
 */

function startApp() {

    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_ryYbpO97e";
    const kinveyAppSecret = "8e942003aed34208a5942dc2409a089f";
    const kinveyAppAuthHeaders = {
        'Authorization': "Basic " +
        btoa(kinveyAppKey + ":" + kinveyAppSecret),
    };

    sessionStorage.clear();
    showHideMenuLinks();
    showView('viewAppHome');

// Bind the navigation menu links
    $("#linkMenuAppHome").click(showHomeBeforeLoginView);
    $("#linkMenuUserHome").click(showHomeAfterLoginView);
    $("#linkMenuLogin").click(showLoginView);
    $("#linkMenuRegister").click(showRegisterView);
    $("#linkUserHomeMyMessages").click(listMyMessages);
    $("#linkMenuMyMessages").click(listMyMessages);
    $("#linkMenuArchiveSent").click(listArchiveMessages);
    $("#linkUserHomeArchiveSent").click(listArchiveMessages);
    $("#linkMenuSendMessage").click(showSendMessageView);
    $("#linkUserHomeSendMessage").click(showSendMessageView);
    $("#linkMenuLogout").click(logoutUser);
// Bind the form submit buttons
    $("#formLogin :input[type=submit]").click(loginUser);
    $("#formRegister :input[type=submit]").click(registerUser);
    $("#formSendMessage :input[type=submit]").click(sendMessage);
// Bind the info / error boxes: hide on click
    $("#infoBox, #errorBox").click(function () {
        $(this).fadeOut();
    });
// Attach AJAX "loading" event listener
    $(document).on({
        ajaxStart: function () {
            $("#loadingBox").show()
        },
        ajaxStop: function () {
            $("#loadingBox").hide()
        }
    });
    function showHideMenuLinks() {
        if (sessionStorage.getItem('authToken')) {
            // We have logged in user
            $("#linkMenuAppHome").hide();
            $("#linkMenuLogin").hide();
            $("#linkMenuRegister").hide();
            $("#linkMenuUserHome").show();
            $("#linkMenuMyMessages").show();
            $("#linkMenuArchiveSent").show();
            $("#linkMenuSendMessage").show();
            $("#linkMenuLogout").show();
        } else {
            // No logged in user
            $("#linkMenuAppHome").show();
            $("#linkMenuLogin").show();
            $("#linkMenuRegister").show();
            $("#linkMenuUserHome").hide();
            $("#linkMenuMyMessages").hide();
            $("#linkMenuArchiveSent").hide();
            $("#linkMenuSendMessage").hide();
            $("#linkMenuLogout").hide();
        }
    }

    function showView(viewName) {
        // Hide all views and show the selected view only
        $('main > section').hide();
        $('main > div').hide();
        $('#' + viewName).show();
    }

    function showHomeBeforeLoginView() {
        showView('viewAppHome');
    }

    function showHomeAfterLoginView() {
        showView('viewUserHome');
    }

    function showLoginView() {
        showView('viewLogin');
        $('#formLogin').trigger('reset');
    }

    function showRegisterView() {
        $('#formRegister').trigger('reset');
        showView('viewRegister');
    }

    function showSendMessageView() {
        $('#formSendMessage').trigger('reset');
        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "user/" + kinveyAppKey,
            headers: getKinveyUserAuthHeaders(),
            success: loadMessagesSuccess,
            error: handleAjaxError
        });

        function loadMessagesSuccess(users) {
            $('#msgRecipientUsername').empty();
            for (let user of users) {
                let option = $('<option>').text(formatSender(user.name, user.username));
                $('#msgRecipientUsername').append(option);
            }
        }

        showView('viewSendMessage');
    }

    function saveAuthInSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authToken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let username = userInfo.username;
        sessionStorage.setItem('username', username);
        let name = userInfo.name;
        sessionStorage.setItem('name', name);
        $('#spanMenuLoggedInUser').text(
            "Welcome, " + username + "!");
        $('#viewUserHomeHeading').text(
            "Welcome, " + username + "!");
    }

    function handleAjaxError(response) { //TODO errors login
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0)
            errorMsg = "Cannot connect due to network error.";
        if (response.responseJSON &&
            response.responseJSON.description)
            errorMsg = response.responseJSON.description;
        showError(errorMsg);
    }

    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function () {
            $('#infoBox').fadeOut();
        }, 3000);
    }

    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }


    function registerUser() {
        event.preventDefault();
        if ($('#formRegister input[name=username]').val() === "" && $('#formRegister input[name=password]').val() === "") {
            showError("Please fill username, password fields!");
            return;
        }
        else if ($('#formRegister input[name=username]').val() === "") {
            showError("Please fill username field!");
            return;
        }
        else if ($('#formRegister input[name=password]').val() === "") {
            showError("Please fill password field!");
            return;
        }
        let userData = {
            username: $('#formRegister input[name=username]').val(),
            password: $('#formRegister input[name=password]').val(),
            name: $('#formRegister input[name=name]').val()
        };
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: registerSuccess,
            error: handleAjaxError
        });
        function registerSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            showHomeAfterLoginView();
            //listBooks();
            showInfo('User registration successful.');
        }
    }

    function loginUser(event) {
        event.preventDefault();
        if ($('#formLogin :input[name=username]').val() === "" && $('#formLogin input[name=username]').val() === "") {
            showError("Please fill username, password fields!");
            return;
        }
        else if ($('#formLogin :input[name=username]').val() === "") {
            showError("Please fill username field!");
            return;
        }
        else if ($('#formLogin input[name=password]').val() === "") {
            showError("Please fill password field!");
            return;
        }
        let userData = {
            username: $('#formLogin :input[name=username]').val(),
            password: $('#formLogin :input[name=password]').val()
        };
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/login",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: loginSuccess,
            error: handleAjaxError
        });
        function loginSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            showHomeAfterLoginView();
            //listBooks();
            showInfo('Login successful.');
        }
    }

    function logoutUser() {
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/_logout",
            headers: {
                'Authorization': "Kinvey " +
                sessionStorage.getItem("authToken")
            },
            success: logoutSuccess,
            error: handleAjaxError
        });

        function logoutSuccess() {
            sessionStorage.clear();
            $('#spanMenuLoggedInUser').text(
                "Welcome, " + '{user}' + "!");
            showHideMenuLinks();
            showView('viewAppHome');
            showInfo('Logout successful.');
        }
    }

    function listMyMessages() {
        $('#myMessages').empty();
        showView('viewMyMessages');
        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/Messages" + `/?query={"recipient_username":"${sessionStorage.getItem("username")}"}`,
            headers: getKinveyUserAuthHeaders(),
            success: loadMessagesSuccess,
            error: handleAjaxError
        });
        function loadMessagesSuccess(messages) {
            showInfo('Messages loaded.');
            let messagesTable = $('<table>')
                .append($('<tr>').append(
                    '<th>From</th><th>Message</th>',
                    '<th>Date Received</th>'));
            if (messages.length == 0) {
                $('#myMessages').append(messagesTable);
            } else {
                for (let message of messages)
                    appendMessageRow(message, messagesTable);
                $('#myMessages').append(messagesTable);
            }
            function appendMessageRow(message, messagesTable) {
                let date = formatDate(message._kmd.ect);
                let sender = formatSender(message.sender_name, message.sender_username);

                messagesTable.append($('<tr>').append(
                    $('<td>').text(sender),
                    $('<td>').text(message.text),
                    $('<td>').text(date)
                    //$('<td>').append(links)
                ))
                ;
            }
        }
    }

    function getKinveyUserAuthHeaders() {
        return {
            'Authorization': "Kinvey " +
            sessionStorage.getItem('authToken'),
        };
    }

    function formatDate(dateISO8601) {
        let date = new Date(dateISO8601);
        if (Number.isNaN(date.getDate()))
            return '';
        return date.getDate() + '.' + padZeros(date.getMonth() + 1) +
            "." + date.getFullYear() + ' ' + date.getHours() + ':' +
            padZeros(date.getMinutes()) + ':' + padZeros(date.getSeconds());

        function padZeros(num) {
            return ('0' + num).slice(-2);
        }
    }

    function formatSender(name, username) {
        if (!name)
            return username;
        else
            return username + ' (' + name + ')';
    }

    function listArchiveMessages() {
        $('#myMessages').empty();
        showView('viewMyMessages');
        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/Messages" + `/?query={"sender_username":"${sessionStorage.getItem("username")}"}`,
            headers: getKinveyUserAuthHeaders(),
            success: loadMessagesSuccess,
            error: handleAjaxError
        });
        function loadMessagesSuccess(messages) {
            showInfo('Messages loaded.');
            let messagesTable = $('<table>')
                .append($('<tr>').append(
                    '<th>To</th><th>Message</th>',
                    '<th>Date Received</th><th>Actions</th>'));
            if (messages.length == 0) {
                $('#myMessages').append(messagesTable);
            } else {
                for (let message of messages)
                    appendMessageRow(message, messagesTable);
                $('#myMessages').append(messagesTable);
            }
            function appendMessageRow(message, messagesTable) {
                let links = [];
                if (message._acl.creator == sessionStorage['userId']) {
                    let deleteLink = $('<input type="button" value="Delete"></input>')
                        .click(function () {
                            deleteMessage(message)
                        });
                    links = [deleteLink];
                }
                let date = formatDate(message._kmd.ect);

                messagesTable.append($('<tr>').append(
                    $('<td>').text(message.recipient_username),
                    $('<td>').text(message.text),
                    $('<td>').text(date),
                    $('<td>').append(links)
                ));
            }
        }
    }

    function sendMessage() {
        event.preventDefault();
        let recipientUsername = $('#formSendMessage #msgRecipientUsername').val().split(' (');
        if ($('#formSendMessage #msgText').val() === "") {
            showError("Please fill text field!");
            return;
        }
        let messageData = {
            sender_username: sessionStorage.getItem("username"),
            sender_name: sessionStorage.getItem("name"),
            recipient_username: recipientUsername[0],
            text: $('#formSendMessage #msgText').val()
        };
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/Messages",
            headers: getKinveyUserAuthHeaders(),
            data: messageData,
            success: sendMessageSuccess,
            error: handleAjaxError
        });

        function sendMessageSuccess(response) {
            listArchiveMessages();
            showInfo('Message sent.');
        }
    }

    function deleteMessage(message) {
        $.ajax({
            method: "DELETE",
            url: kinveyMessageUrl = kinveyBaseUrl + "appdata/" +
                kinveyAppKey + "/Messages/" + message._id,
            headers: getKinveyUserAuthHeaders(),
            success: deleteMessageSuccess,
            error: handleAjaxError
        });
        function deleteMessageSuccess(response) {
            listArchiveMessages();
            showInfo('Message deleted.');
        }
    }
}