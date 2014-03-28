__author__ = 'Steve'

from jinja2 import Template, Environment, PackageLoader
env = Environment(loader=PackageLoader('default_app','templates'))

class DefaultApp (object):

    def __init__(self, title= "Untitled", template=None,config=None):
        self.title = title
        self.template = env.get_template(template)

    def get_app(self, context):
        context["title"] = self.title
        return self.template.render(**context)
