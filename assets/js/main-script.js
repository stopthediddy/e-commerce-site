const quickMenuRight = document.getElementById("quickMenuRight");
const quickMenuLeft = document.getElementById("quickMenuLeft");

const qm_fullWidth = quickMenu.scrollWidth;
const qm_viewWidth = quickMenu.offsetWidth;

var count1 = 0;
var count2 = 0;
var qm_worker1 = 0;
var qm_worker2 = 0;
var n1 = 6;
var n2 = 4;

function scrollToLeft() {
    var quickMenu = document.getElementById("quickMenu");
    // quickMenu.scrollLeft -= 100;
    qm_worker1 = setInterval(() => {
        if (count1 < 150) {
            quickMenu.scrollLeft -= n1;
            count1 = count1 + n2;
        } else {
            count1 = 0;
            clearInterval(qm_worker1);

            var qm_scrollPosition = quickMenu.scrollLeft;

            if (qm_scrollPosition == 0) {
                quickMenuLeft.classList.add("arrow-hidden");
            }

            if (qm_scrollPosition < qm_fullWidth - qm_viewWidth) {
                quickMenuRight.classList.remove("arrow-hidden");
            }
        }
    }, 10);
}

function scrollToRight() {
    var quickMenu = document.getElementById("quickMenu");
    // quickMenu.scrollLeft += 100;
    qm_worker2 = setInterval(() => {
        if (count2 < 100) {
            quickMenu.scrollLeft += n1;
            count2 = count2 + n2;
        } else {
            count2 = 0;
            clearInterval(qm_worker2);

            var qm_scrollPosition = quickMenu.scrollLeft;

            if (qm_scrollPosition > 0) {
                quickMenuLeft.classList.remove("arrow-hidden");
            }

            if (qm_scrollPosition > qm_fullWidth - qm_viewWidth - 10) {
                quickMenuRight.classList.add("arrow-hidden");
            }
        }
    }, 10);
}

// login page ------------------------------------------------------------------------------------

// const login_errorMsg = document.getElementById("login-error-msg");
// const register_errorMsg = document.getElementById("register-error-msg");

var loginBtn_clicked;
var registerBtn_clicked;

function showLoginForm() {
    if (loginBtn_clicked == 0) {
        var loginForm = document.getElementById("loginForm");
        var registerForm = document.getElementById("registerForm");

        var loginBtn = document.getElementById("loginBtn");
        var registerBtn = document.getElementById("registerBtn");

        var loginBtn_bg = document.getElementById("loginBtn_bg");
        var registerBtn_bg = document.getElementById("registerBtn_bg");

        loginBtn.classList.add("br-custom-1");
        loginBtn.classList.remove("br-custom-3");

        registerBtn.classList.remove("br-custom-1");
        registerBtn.classList.add("br-custom-2");

        loginBtn_bg.classList.remove("br-custom-bg");
        registerBtn_bg.classList.add("br-custom-bg");

        loginForm.classList.remove("d-none");
        registerForm.classList.add("d-none");

        loginBtn_clicked = 1;
        registerBtn_clicked = 0;
    }
}

function showRegisterForm() {
    if (registerBtn_clicked != 1) {
        var loginForm = document.getElementById("loginForm");
        var registerForm = document.getElementById("registerForm");

        var loginBtn = document.getElementById("loginBtn");
        var registerBtn = document.getElementById("registerBtn");

        var loginBtn_bg = document.getElementById("loginBtn_bg");
        var registerBtn_bg = document.getElementById("registerBtn_bg");

        loginBtn.classList.remove("br-custom-1");
        loginBtn.classList.add("br-custom-3");

        registerBtn.classList.add("br-custom-1");
        registerBtn.classList.remove("br-custom-2");

        loginBtn_bg.classList.add("br-custom-bg");
        registerBtn_bg.classList.remove("br-custom-bg");

        loginForm.classList.add("d-none");
        registerForm.classList.remove("d-none");

        loginBtn_clicked = 0;
        registerBtn_clicked = 1;
    }
}

// login page pw-btn -----------------------------------------------------------------------------
var showPW_btn_clicked;

function showPW() {
    var showPW_btn = document.getElementById("showPW_btn");
    var pw = document.getElementById("inputPassword1");


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

var showPW_btn2_clicked;

function showPW2() {
    var showPW_btn2 = document.getElementById("showPW_btn2");
    var pw = document.getElementById("inputPassword2");


    if (showPW_btn2_clicked != 0) {
        showPW_btn2.classList.remove("bi-eye-slash-fill");
        showPW_btn2.classList.add("bi-eye-fill");
        pw.type = 'text';
        showPW_btn2_clicked = 0;
    } else {
        showPW_btn2.classList.remove("bi-eye-fill");
        showPW_btn2.classList.add("bi-eye-slash-fill");
        pw.type = 'password';
        showPW_btn2_clicked = 1;
    }
}

// single product page ---------------------------------------------------------------------------
function singleProductView() {
    window.location.href = "single-product-view.html";
}