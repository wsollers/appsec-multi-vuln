const value = new URLSearchParams(window.location.search).get("message") || "hello";
document.querySelector("#output").innerHTML = value;
