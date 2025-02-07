document.onreadystatechange = function () {
    if (document.readyState !== "complete") {
        document.body.style.pointerEvents = "none";
    } else {
        setTimeout(() => {
            document.querySelector(".loader-div").classList.add('hidden');
            document.body.style.pointerEvents = "all";
        }, 500);
    }
};