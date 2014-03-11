from flask import Flask, url_for
from jinja2 import Template, Environment, PackageLoader
from Apps import poweralert
import imp
env = Environment(loader=PackageLoader('J5apps', 'templates'))

app = Flask(__name__)

@app.route('/')
def index():
    app_body = env.get_template('filter_str.html').render()
    body = env.get_template('app_template.html').render(title="Filter String App", app_body=app_body)
    return env.get_template('index.html').render(body=body, url_for=url_for)

@app.route('/<app>/')
def power_alert(app):
    allowed_apps = "poweralert"
    fp, pathname, description = imp.find_module("Apps/poweralert")
    print(pathname)
    app_body = getattr(imp.load_module(app, fp, pathname, description),app)().get_app()
    body = env.get_template('app_template.html').render(title="Filter String App", app_body=app_body)
    return env.get_template('index.html').render(body=body, url_for=url_for)

if __name__ == '__main__':
    app.run(debug=True)