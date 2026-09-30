from flask import Flask, render_template_string, request

app = Flask(__name__)


@app.route("/")
def greet():
    name = request.args.get("name", "sample")
    return render_template_string("<p>Hello " + name + "</p>")


if __name__ == "__main__":
    app.run(port=8080)
