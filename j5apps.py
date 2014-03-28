from flask import Flask, url_for
from jinja2 import Template, Environment, PackageLoader
import imp
import sys
import os
try:
    import ConfigParser as configparser
except:
    import configparser


sys.path.append(os.path.dirname(__file__))
env = Environment(loader=PackageLoader('j5apps', 'templates'))

app = Flask(__name__)

available_apps = {}

@app.route('/')
def index():
    app_body = env.get_template('filter_str.html').render()
    body = env.get_template('app_template.html').render(title="Filter String App", app_body=app_body)
    return env.get_template('index.html').render(body=body, url_for=url_for)

@app.route('/app/<app>')
def apss(app):
    app_body= available_apps[app].get_app()
    body = env.get_template('app_template.html').render(title="Filter String App", app_body=app_body)
    return env.get_template('index.html').render(body=body, url_for=url_for)

@app.route("/app/<app>/download/<filename>")
def download_file (app,filename):
    #try:
    return available_apps[app].download_file(filename)
    #except Exception as e:
    #    print(e)
    #    return page_not_found(e)

def load_apps(config):
    allowed_apps = ("poweralert","j5builds")
    for app in allowed_apps:
        fp, pathname, description = imp.find_module(app,["apps",app+".py"])
        available_apps[app] = getattr(imp.load_module(app, fp, pathname, description),app)(config=config)

@app.errorhandler(404)
def page_not_found(e):
    return "404: File not found"

if __name__ == '__main__':
    config = configparser.ConfigParser()
    if len(sys.argv) > 1:
        config.read([sys.argv[1]])
    else:
        config = None
    load_apps(config)
    app.run(debug=True,port=5000, host="0.0.0.0")