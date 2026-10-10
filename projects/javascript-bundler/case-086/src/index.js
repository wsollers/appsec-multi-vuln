const value = new URLSearchParams(window.location.search).get("message") || "hello";
// Synthetic CWE-79: query text is assigned to an HTML interpretation sink.
document.querySelector("#output").innerHTML = value;
