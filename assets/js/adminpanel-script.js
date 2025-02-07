function openTabs(event, tabID) {
    var selectedTab = document.getElementById(tabID);
    var allTabs = document.querySelectorAll(".admin-tab");

    allTabs.forEach(function (tab) {
        tab.classList.remove("admin-tab-d");
    });

    selectedTab.classList.add("admin-tab-d");
}


// admin login page ------------------------------------------------------------------------------
function triggerAdminLoginModal() {
    var adminLoginModalBtn = document.getElementById("admin-login-modal-btn");
    adminLoginModalBtn.click();
}

// admin sign in ---------------------------------------------------------------------------------
function adminSignIn() {
    // var  data-bs-dismiss="modal"
    var modalBtn = document.getElementById("modalBtn");
    var inputAdminPassword = document.getElementById("inputAdminPassword");
    var inputAdminEmail = document.getElementById("inputAdminEmail");

    if (inputAdminEmail.value.trim() !== "" && inputAdminPassword.value.trim() !== "") {
        modalBtn.dataset.bsDismiss = "modal";

        modalBtn.click();
    }
}

// show/hide password -----------------------------------------------------------------------------

var showPW_btn_clicked;

function showPW() {
    var showPW_btn = document.getElementById("showPW_btn");
    var pw = document.getElementById("inputAdminPassword");


    if (showPW_btn_clicked != 0) {
        showPW_btn.classList.remove("bi-eye-slash-fill");
        showPW_btn.classList.add("bi-eye-fill");
        pw.type = 'text';
        showPW_btn_clicked = 0;
    } else {
        showPW_btn.classList.remove("bi-eye-fill");
        showPW_btn.classList.add("bi-eye-slash-fill");
        pw.type = 'password';
        showPW_btn_clicked = 1;
    }
}