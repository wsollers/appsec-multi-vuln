from urllib.request import urlopen

from flask import Flask, request

app = Flask(__name__)


@app.route("/fetch")
def fetch():
    url = request.args.get("url", "http://127.0.0.1:8080/")
    with urlopen(url, timeout=5) as response:
        return response.read()


if __name__ == "__main__":
    app.run(port=8080)
