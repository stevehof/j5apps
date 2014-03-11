__author__ = 'Steve'

from jinja2 import Template, Environment, PackageLoader
env = Environment(loader=PackageLoader('App','templates'))

class DefaultApp ():

    def __init__(self, title= "Untitled", template=None):
        self.title = title
        self.template = env.get_template(template)

    def get_app(self, context):
        context["title"] = self.title
        return self.template.render(**context)
