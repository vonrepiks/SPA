function startApp() {

    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_r1EUjIDfl";
    const kinveyAppSecret = "a0ab529162bd40eeb523e4702331f7ca";
    const kinveyAppAuthHeaders = {
        'Authorization': "Basic " +
        btoa(kinveyAppKey + ":" + kinveyAppSecret),
    };
    let loggedUser;

    sessionStorage.clear(); // Clear user auth data
    showHideMenuLinks();
    showView('viewHome');
    // Bind the navigation menu links
    $("#linkHome").click(showHomeView);
    // Bind the form submit buttons

    // Bind the navigation menu links
    $("#linkHome").click(showHomeView);
    $("#linkLogin").click(showLoginView);
    $("#linkRegister").click(showRegisterView);
    $("#linkListAds").click(listAds);
    $("#linkCreateAd").click(showCreateAdView);
    $("#linkLogout").click(logoutUser);
// Bind the form submit buttons
    $("#buttonLoginUser").click(loginUser);
    $("#buttonRegisterUser").click(registerUser);
    $("#buttonCreateAd").click(createAd);
    $("#buttonEditAd").click(editAd);
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
        $("#linkHome").show();
        if (sessionStorage.getItem('authToken')) {
            // We have logged in user
            $("#linkLogin").hide();
            $("#linkRegister").hide();
            $("#linkListAds").show();
            $("#linkCreateAd").show();
            $("#linkLogout").show();
        } else {
            // No logged in user
            $("#linkLogin").show();
            $("#linkRegister").show();
            $("#linkListAds").hide();
            $("#linkCreateAd").hide();
            $("#linkLogout").hide();
        }
    }

    function showView(viewName) {
        // Hide all views and show the selected view only
        $('main > section').hide();
        $('#' + viewName).show();
    }

    function showHomeView() {
        showView('viewHome');
    }

    function showLoginView() {
        showView('viewLogin');
        $('#formLogin').trigger('reset');
    }

    function showRegisterView() {
        $('#formRegister').trigger('reset');
        showView('viewRegister');
    }

    function showCreateAdView() {
        $('#formCreateAd').trigger('reset');
        showView('viewCreateAd');
    }

    function logoutUser() {
        sessionStorage.clear();
        $('#loggedInUser').text("");
        showHideMenuLinks();
        showView('viewHome');
        showInfo('Logout successful.');

    }

    function loginUser() {
        let userData = {
            username: $('#formLogin input[name=username]').val(),
            password: $('#formLogin input[name=passwd]').val()
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
            loggedUser = userInfo;
            listAds();
            showInfo('Login successful.');
        }

    }

    function registerUser() {
        if ($('#formRegister input[name=username]').val() != '' && $('#formRegister input[name=passwd]').val() != '') {
            let userData = {
                username: $('#formRegister input[name=username]').val(),
                password: $('#formRegister input[name=passwd]').val()
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
                listAds();
                showInfo('User registration successful.');
            }
        }
        else {
            if ($('#formRegister input[name=username]').val() == '' && $('#formRegister input[name=passwd]').val() == '') {
                showError('Username field and Password field are required!');
            }
            else if ($('#formRegister input[name=username]').val() == '') {
                showError('Username field is required!');
            }
            else {
                showError('Password field is required!');
            }
        }

    }

    function handleAjaxError(response) {
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0)
            errorMsg = "Cannot connect due to network error.";
        if (response.responseJSON &&
            response.responseJSON.description)
            errorMsg = response.responseJSON.description;
        showError(errorMsg);
    }

    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }

    function saveAuthInSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authToken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let username = userInfo.username;
        $('#loggedInUser').text(
            "Welcome, " + username + "!");
    }

    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function () {
            $('#infoBox').fadeOut();
        }, 3000);
    }

    function listAds() {
        $('#ads').empty();
        showView('viewAds');
        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/advert",
            headers: getKinveyUserAuthHeaders(),
            success: loadAdSuccess,
            error: handleAjaxError
        });
        function loadAdSuccess(ads) {
            showInfo('Ads loaded.');
            let sortedAds = [];
            for (let ad of ads) {
                sortedAds.push(ad);
            }
            sortedAds.sort((a,b) => {return b.Counter - a.Counter});

            if (sortedAds.length == 0) {
                $('#ads').text('No ads.');
            } else {
                let adsTable = $('<table>')
                    .append($('<tr>').append(
                        '<th>Title</th><th>Description</th>',
                        '<th>Publisher</th><th>Date of publishing</th><th>Price</th><th>Actions</th>'));
                for (let ad of sortedAds)
                    appendAdRow(ad, adsTable);
                $('#ads').append(adsTable);
            }
            function appendAdRow(ad, adsTable) {
                let links = [];
                if (ad._acl.creator == sessionStorage['userId']) {
                    let deleteLink = $('<a href="#">[Delete]</a>')
                        .click(function () {
                            deleteAd(ad)
                        });
                    let editLink = $('<a href="#">[Edit]</a>')
                        .click(function () {
                            loadAdForEdit(ad)
                        });
                    links = [deleteLink, ' ', editLink];
                }

                let price = Number(ad.Price).toFixed(2);
                let date = new Date(ad["Date of Pulishing"]);
                date = moment(date).format('MM/DD/YYYY');

                adsTable.append($('<tr>').append(
                    $('<td>').text(ad.Title),
                    $('<td>').text(cutText(ad)).append($('<a href="#">[Read More]</a>')
                        .click(function () {
                            viewAd(ad);
                        })),
                    $('<td>').text(ad.Publisher),
                    $('<td>').text(date),
                    $('<td>').text(price),
                    $('<td>').append(links)
                ));
            }
        }
    }

    function cutText(ad) {
        if (ad.Description.length > 100) {
            let cutText = ad.Description.substring(0, 100);
            return cutText + "..."
        }
        return ad.Description
    }

    function viewAd(ad) {
        let counter = Number(ad.Counter) + 1;

        let adData = {
            Title: ad.Title,
            Publisher: ad.Publisher,
            Description: ad.Description,
            "Date of Pulishing": ad["Date of Pulishing"],
            Price: ad.Price,
            Counter: counter
        };
        $.ajax({
            method: "PUT",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey +
            "/advert/" + ad._id,
            headers: getKinveyUserAuthHeaders(),
            data: adData,
            success: showView('viewSelectedAd'),
            error: handleAjaxError
        });

        $('#viewSelectedAd').empty();

        let div = $('<div>');
        let url = ad.LinkToImage;

        var img = new Image();
        img.onload = function() {
            div.append(img);
        };

        img.src = url;

        div.append($('<h1>').append(ad.Title));
        div.append($('<br>'));
        div.append("Publisher: " + ad.Publisher);
        div.append($('<br>'));
        div.append("Date: " + ad["Date of Pulishing"]);
        div.append($('<br>'));
        div.append($('<br>'));
        div.append(ad.Description);
        div.append($('<br>'));
        div.append($('<br>'));
        div.append($('<h3>').append("Price: " + ad.Price));
        div.append($('<br>'));
        div.append("Views: " + counter);
        $('#viewSelectedAd').append(div);
    }

    function getKinveyUserAuthHeaders() {
        return {
            'Authorization': "Kinvey " +
            sessionStorage.getItem('authToken'),
        };
    }

    function loadAdForEdit(ad) {
        $.ajax({
            method: "GET",
            url: kinveyAdUrl = kinveyBaseUrl + "appdata/" +
                kinveyAppKey + "/advert/" + ad._id,
            headers: getKinveyUserAuthHeaders(),
            success: loadAdForEditSuccess,
            error: handleAjaxError
        });
        function loadAdForEditSuccess(ad) {
            $('#formEditAd input[name=id]').val(ad._id);
            $('#formEditAd input[name=title]').val(ad.Title);
            $('#formEditAd textarea[name=description]').val(ad.Description);
            $('#formEditAd input[name=datePublished]').val(new Date(ad["Date of Pulishing"]));
            $('#formEditAd input[name=price]').val(ad.Price);
            $('#formEditAd input[name=counter]').val(ad.Counter);
            $('#formEditAd input[name=imageLink]').val(ad.LinkToImage);
            showView('viewEditAd');
        }
    }

    function deleteAd(ad) {
        $.ajax({
            method: "DELETE",
            url: kinveyBookUrl = kinveyBaseUrl + "appdata/" +
                kinveyAppKey + "/advert/" + ad._id,
            headers: getKinveyUserAuthHeaders(),
            success: deleteAdSuccess,
            error: handleAjaxError
        });
        function deleteAdSuccess(response) {
            listAds();
            showInfo('Ad deleted.');
        }
    }

    function createAd() {
        let adData = {
            Title: $('#formCreateAd input[name=title]').val(),
            Publisher: loggedUser.username,
            Description: $('#formCreateAd textarea[name=description]').val(),
            "Date of Pulishing": $('#formCreateAd input[name=datePublished]').val(),
            Price: $('#formCreateAd input[name=price]').val(),
            Counter: 0,
            LinkToImage: $('#formCreateAd input[name=imageLink]').val()
        };
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/advert",
            headers: getKinveyUserAuthHeaders(),
            data: adData,
            success: createAdSuccess,
            error: handleAjaxError
        });

        function createAdSuccess(response) {
            listAds();
            showInfo('Ad created.');
        }
    }

    function editAd() {

        let adData = {
            Title: $('#formEditAd input[name=title]').val(),
            Publisher: loggedUser.username,
            Description: $('#formEditAd textarea[name=description]').val(),
            "Date of Pulishing": $('#formEditAd input[name=datePublished]').val(),
            Price: $('#formEditAd input[name=price]').val(),
            Counter: $('#formEditAd input[name=counter]').val(),
            LinkToImage: $('#formEditAd input[name=imageLink]').val()
        };
        $.ajax({
            method: "PUT",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey +
            "/advert/" + $('#formEditAd input[name=id]').val(),
            headers: getKinveyUserAuthHeaders(),
            data: adData,
            success: editAdSuccess,
            error: handleAjaxError
        });

        function editAdSuccess(response) {
            listAds();
            showInfo('Ad edited.');
        }
    }
}